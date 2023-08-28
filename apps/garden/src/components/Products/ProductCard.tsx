import { Button, Card } from 'antd'
import Image from 'next/image'
import type { Stripe } from 'stripe'

const { Meta } = Card

const ProductCard = ({
  product,
  checkoutHandler,
}: {
  product: Stripe.Product
  checkoutHandler: (priceId: string, paymentMode: string) => void
}) => {
  const handleBuyProductClick = () => {
    checkoutHandler(product.id, 'product')
  }

  const renderDisplayPrice = (product: Stripe.Product) => {
    if (product?.default_price === 'string') {
      return <div>{product?.default_price}</div>
    }

    const displayPrice = product.default_price as Stripe.Price

    return (
      <div>
        {displayPrice.currency}{' '}
        {(displayPrice?.unit_amount
          ? displayPrice?.unit_amount / 100
          : 0
        ).toFixed(2)}
      </div>
    )
  }

  return (
    <Card
      className="w-64"
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
          className="px-6 flex gap-2 justify-between items-center"
          onClick={handleBuyProductClick}
        >
          <Button>Buy</Button>
          {renderDisplayPrice(product)}
        </div>,
      ]}
    >
      <Meta title={product.name || ''} description={product.description} />
    </Card>
  )
}

export default ProductCard
