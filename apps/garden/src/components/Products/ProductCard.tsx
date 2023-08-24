import { Button } from 'antd'
import type { Stripe } from 'stripe'

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

  return (
    <div
      className="p-4 max-w-md rounded-lg border-solid border-gray-600"
      title={product.name || ''}
    >
      <div>{product.id}</div>
      <div className="font-bold">{product.name}</div>
      <div>{product.description}</div>
      {/*<div>{product.default_price}</div>*/}
      <div className="mt-2 flex gap-2 flex-wrap justify-center items-center">
        <Button onClick={handleBuyProductClick}>Buy</Button>
      </div>
    </div>
  )
}

export default ProductCard
