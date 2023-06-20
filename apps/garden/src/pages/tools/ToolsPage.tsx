import ApiKeys from '@/components/ApiKeys'
import MannaVoucherRedeem from '@/components/MannaVoucherRedeem'
import React from 'react'

const ToolsPage = () => {
  return (
    <div className="w-full grid grid-cols-12">
      <div className="flex flex-col space-y-4 col-span-12 xl:col-span-8 mb-4">
        <ApiKeys />
        <MannaVoucherRedeem />
      </div>
    </div>
  )
}

export default ToolsPage
