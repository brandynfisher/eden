import { Product } from '@edenlabs/eden-sdk'
import { Button, Card } from 'antd'
import Image from 'next/image'

const { Meta } = Card

export const renderDisplayPrice = (product: Product) => {
  const { displayPrice } = product
  return (
    <div>
      {displayPrice.currency.toUpperCase()}{' '}
      <strong>
        {(displayPrice?.unit_amount
          ? displayPrice?.unit_amount / 100
          : 0
        ).toFixed(2)}
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
  const handleBuyProductClick = () => {
    checkoutHandler(product.default_price, 'payment')
  }

  return (
    <Card
      className="w-64 product-card"
      cover={
        <Image
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
          {renderDisplayPrice(product)}
        </div>,
      ]}
    >
      <Meta title={product.name || ''} description={product.description} />
    </Card>
  )
}

export default ProductCard
