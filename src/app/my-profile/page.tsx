import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserCircle, ArrowRight, Users } from 'lucide-react'
import { getAppSettings, getMyProfile, getMyPositions } from '@/lib/queries'

export const revalidate = 0

export default async function MyProfilePage() {
  const [settings, myProfile, myPositions] = await Promise.all([
    getAppSettings(),
    getMyProfile(),
    getMyPositions()
  ])

  // If profile is set, show it directly or redirect
  if (myProfile) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <Link
            href={`/people/${myProfile.id}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Full Profile
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {myProfile.avatar_url ? (
              <img
                src={myProfile.avatar_url}
                alt={myProfile.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <UserCircle className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 dark:text-blue-300" />
              </div>
            )}
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{myProfile.name}</h2>
              {myProfile.email && (
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{myProfile.email}</p>
              )}
              {(myProfile.city || myProfile.country) && (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {[myProfile.city, myProfile.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* My Positions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">My Positions</h2>
            <Link
              href={`/people/${myProfile.id}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Position
            </Link>
          </div>
          
          {myPositions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No positions yet. Add your work history to link it to interactions.
            </p>
          ) : (
            <div className="space-y-3">
              {myPositions.map((pos) => (
                <div
                  key={pos.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{pos.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {pos.companies?.name || 'Unknown company'}
                    </p>
                  </div>
                  {pos.active && (
                    <span className="inline-flex items-center self-start sm:self-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 whitespace-nowrap">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{myPositions.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Positions</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
              {myPositions.filter(p => p.active).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
          </div>
        </div>
      </div>
    )
  }

  // No profile set - show setup prompt
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <UserCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
          No Profile Set
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm sm:text-base">
          Set your profile to track interactions in the context of your positions. 
          Go to any person and click "Set as My Profile".
        </p>
        <Link
          href="/people"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Users className="w-4 h-4" />
          Browse People
        </Link>
      </div>
    </div>
  )
}
