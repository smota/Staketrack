import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { stakeSchema } from '../lib/schemas';
import type { Stake } from '../types';

const Dashboard: React.FC = () => {
  const { data: stakes, isLoading } = useQuery({
    queryKey: ['stakes', auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) throw new Error('Not authenticated');

      const stakesRef = collection(db, 'stakes');
      const q = query(
        stakesRef,
        where('userId', '==', auth.currentUser.uid),
        where('status', '==', 'active')
      );

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
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Active Stakes</h2>
          <p className="text-3xl font-bold text-primary-600">
            {stakes?.length ?? 0}
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Total Value</h2>
          <p className="text-3xl font-bold text-primary-600">
            ${stakes?.reduce((sum, stake) => sum + stake.amount, 0).toFixed(2)}
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Avg. APY</h2>
          <p className="text-3xl font-bold text-primary-600">
            {stakes && stakes.length > 0
              ? (
                stakes.reduce((sum, stake) => sum + stake.apy, 0) /
                stakes.length
              ).toFixed(2)
              : '0.00'}
            %
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Est. Monthly Rewards</h2>
          <p className="text-3xl font-bold text-primary-600">
            ${stakes?.reduce((sum, stake) => sum + (stake.amount * stake.apy / 1200), 0).toFixed(2)}
          </p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Stakes</h2>
      <div className="space-y-4">
        {stakes?.map((stake: Stake) => (
          <div key={stake.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {stake.platform}
                </h3>
                <p className="text-sm text-gray-500">
                  Started {stake.startDate.toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-900">
                  ${stake.amount.toFixed(2)}
                </p>
                <p className="text-sm text-primary-600">{stake.apy}% APY</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 