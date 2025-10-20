
from .models import Product
from .schemas import ProductCreateSchema

def add_product_to_profile(profile, product_data: ProductCreateSchema):
	product = Product.objects.create(
		profile=profile,
		name=product_data.name,
		description=product_data.description or "",
		price=product_data.price
	)
	return product
