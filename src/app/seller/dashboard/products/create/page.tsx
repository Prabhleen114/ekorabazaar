import SellerProductForm from '@/components/SellerProductForm'

export default function CreateProductPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-bold font-serif text-brand-charcoal">Add New Product</h1>
        <p className="text-brand-charcoal/60 mt-2">List a new wholesale item to your catalog.</p>
      </div>
      <SellerProductForm />
    </div>
  )
}
