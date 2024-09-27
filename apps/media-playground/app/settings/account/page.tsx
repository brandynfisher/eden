import TypographyH4 from '@/components/ui/typography/TypographyH4'
// import ConnectedAccountsCard from '@/features/account/connected-accounts-card'
// import EmailCard from '@/features/account/email-card'
import ManageAccountCard from '@/features/account/manage-account-card'
// import ProfileImageCard from '@/features/account/profile-image-card'
// import UsernameCard from '@/features/account/username-card'
// import { currentUser } from '@clerk/nextjs/server'
import React from 'react'

const SettingsAccountPage = async () => {
  // const user = await currentUser()

  // const primaryEmail = user?.emailAddresses.find(
  //   email => email.id === user.primaryEmailAddressId,
  // )

  // const connectedEmails =
  //   user?.emailAddresses
  //     .filter(email => email.linkedTo.length > 0)
  //     .map(email => ({
  //       id: email.id,
  //       email: email.emailAddress,
  //       linkedTo: email.linkedTo[0].id,
  //     })) || []

  // if (!user) {
  //   return null
  // }

  return (
    <>
      <TypographyH4>Account</TypographyH4>
      <ManageAccountCard />
      {/* <ProfileImageCard />
      <UsernameCard />
      <EmailCard primaryEmail={primaryEmail?.emailAddress || ''} />
      <ConnectedAccountsCard connectedEmails={connectedEmails} /> */}
    </>
  )
}

export default SettingsAccountPage
