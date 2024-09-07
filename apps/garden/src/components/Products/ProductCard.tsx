import CdnImage from '@/components/Media/cdn-image'
import { UserContext } from '@/providers/UserProvider'
import { Product, SubscriptionTier } from '@edenlabs/eden-sdk'
import { Button, Card } from 'antd'
import { useContext } from 'react'

const { Meta } = Card

const discountFactorMap: { [key in SubscriptionTier]: number } = {
  0: 1,
  1: 0.9,
  2: 0.8,
  3: 0.7,
  4: 1,
}

export const renderDisplayPrice = (
  product: Product,
  subscriptionTier?: SubscriptionTier,
) => {
  const { displayPrice } = product
  const discountFactor = discountFactorMap[subscriptionTier || 0]
  const discountedPrice = (
    displayPrice?.unit_amount
      ? (displayPrice?.unit_amount / 100) * discountFactor
      : 0
  ).toFixed(2)

  return (
    <div>
      {displayPrice.currency.toUpperCase()}{' '}
      <strong>
        {discountFactor < 1 ? (
          <>
            <span style={{ textDecoration: 'line-through' }}>
              {(displayPrice?.unit_amount / 100).toFixed(2)}
            </span>
            {' ' + discountedPrice}
          </>
        ) : (
          discountedPrice
        )}
      </strong>
    </div>
  )
}

const ProductCard = ({
  product,
  checkoutHandler,
}: {
  product: Product
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const { user } = useContext(UserContext)
  const handleBuyProductClick = () => {
    checkoutHandler(product.default_price, 'payment')
  }

  return (
    <Card
      className="w-64 product-card"
      cover={
        <CdnImage
          width={256}
          height={256}
          alt={product.name || ''}
          src={
            product.images && product.images.length
              ? product.images[0]
              : '/eden-logo-512x512.png'
          }
          className="bg-gray-100 dark:bg-gray-800 "
        />
      }
      actions={[
        <div
          key={product.id}
          className="px-4 flex gap-2 justify-between items-center"
        >
          <Button onClick={handleBuyProductClick}>Buy</Button>
          {renderDisplayPrice(product, user?.subscriptionTier)}
        </div>,
      ]}
    >
      <Meta title={product.name || ''} description={product.description} />
    </Card>
  )
}

export default ProductCard
