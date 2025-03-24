import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { stakeSchema } from '../lib/schemas';
import type { Stake } from '../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createStakeSchema = stakeSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

type CreateStakeForm = z.infer<typeof createStakeSchema>;

const Stakes: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStake, setEditingStake] = useState<Stake | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateStakeForm>({
    resolver: zodResolver(createStakeSchema),
    defaultValues: editingStake || {
      amount: 0,
      currency: 'USD',
      platform: '',
      apy: 0,
      startDate: new Date(),
      status: 'active' as const,
    },
  });

  const { data: stakes, isLoading } = useQuery({
    queryKey: ['stakes', auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) throw new Error('Not authenticated');

      const stakesRef = collection(db, 'stakes');
      const q = query(stakesRef, where('userId', '==', auth.currentUser.uid));
      const snapshot = await getDocs(q);

      const stakes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      }));

      return stakes.map(stake => stakeSchema.parse(stake));
    },
    enabled: !!auth.currentUser,
  });

  const createStake = useMutation({
    mutationFn: async (data: CreateStakeForm) => {
      if (!auth.currentUser) throw new Error('Not authenticated');

      const stake = {
        ...data,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'stakes'), stake);
      return { id: docRef.id, ...stake };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakes'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const updateStake = useMutation({
    mutationFn: async (data: Stake) => {
      const stakeRef = doc(db, 'stakes', data.id);
      await updateDoc(stakeRef, { ...data, updatedAt: new Date() });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakes'] });
      setIsModalOpen(false);
      setEditingStake(null);
      reset();
    },
  });

  const deleteStake = useMutation({
    mutationFn: async (id: string) => {
      const stakeRef = doc(db, 'stakes', id);
      await deleteDoc(stakeRef);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stakes'] });
    },
  });

  const onSubmit = (data: CreateStakeForm) => {
    if (editingStake) {
      updateStake.mutate({ ...editingStake, ...data });
    } else {
      createStake.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Stakes</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          Add Stake
        </button>
      </div>

      <div className="space-y-4">
        {stakes?.map((stake) => (
          <div key={stake.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {stake.platform}
                </h3>
                <p className="text-sm text-gray-500">
                  Started {stake.startDate.toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  Status: <span className="capitalize">{stake.status}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-900">
                  ${stake.amount.toFixed(2)}
                </p>
                <p className="text-sm text-primary-600">{stake.apy}% APY</p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => {
                      setEditingStake(stake);
                      setIsModalOpen(true);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteStake.mutate(stake.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {editingStake ? 'Edit Stake' : 'Add Stake'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Platform
                </label>
                <input
                  type="text"
                  {...register('platform')}
                  className="input mt-1"
                />
                {errors.platform && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.platform.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="input mt-1"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  APY (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('apy', { valueAsNumber: true })}
                  className="input mt-1"
                />
                {errors.apy && (
                  <p className="mt-1 text-sm text-red-600">{errors.apy.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  {...register('startDate', { valueAsDate: true })}
                  className="input mt-1"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select {...register('status')} className="input mt-1">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {errors.status && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingStake(null);
                    reset();
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStake ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stakes; 