import TypographyH4 from '@/components/ui/typography/TypographyH4'
import ManageAccountCard from '@/features/account/manage-account-card'
import { TransactionHistory } from '@/features/account/transaction-history'
import { UserPreferences } from '@/features/account/user-preferences'
import React from 'react'

const SettingsAccountPage = async () => {
  return (
    <div className="space-y-6">
      <TypographyH4>Account</TypographyH4>
      <ManageAccountCard />

      <TypographyH4>Preferences</TypographyH4>
      <UserPreferences />

      <TypographyH4>Transaction History</TypographyH4>
      <div className="mt-4">
        <TransactionHistory />
      </div>
    </div>
  )
}

export default SettingsAccountPage
