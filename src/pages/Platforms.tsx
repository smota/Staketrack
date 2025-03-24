import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { platformSchema } from '../lib/schemas';
import type { Platform } from '../types';

const Platforms: React.FC = () => {
  const { data: platforms, isLoading } = useQuery({
    queryKey: ['platforms'],
    queryFn: async () => {
      const platformsRef = collection(db, 'platforms');
      const snapshot = await getDocs(platformsRef);
      const platforms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      return platforms.map(platform => platformSchema.parse(platform));
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">
        Staking Platforms
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {platforms?.map((platform) => (
          <div key={platform.id} className="card">
            <div className="flex items-center mb-4">
              <img
                src={platform.logo}
                alt={platform.name}
                className="h-8 w-8 rounded-full"
              />
              <h2 className="ml-3 text-lg font-medium text-gray-900">
                {platform.name}
              </h2>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-sm font-medium text-gray-500">APY Range</p>
                <p className="text-lg font-medium text-primary-600">
                  {platform.apyRange.min}% - {platform.apyRange.max}%
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Supported Currencies
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {platform.supportedCurrencies.map((currency) => (
                    <span
                      key={currency}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {currency}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Minimum Stake Amount
                </p>
                <div className="space-y-1">
                  {Object.entries(platform.minStakeAmount).map(([currency, amount]) => (
                    <p key={currency} className="text-sm">
                      {currency}: ${amount.toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <a
                href={platform.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary w-full text-center"
              >
                Visit Platform
              </a>
            </div>
          </div>
        ))}
      </div>

      {platforms?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No platforms available</p>
        </div>
      )}
    </div>
  );
};

export default Platforms; 