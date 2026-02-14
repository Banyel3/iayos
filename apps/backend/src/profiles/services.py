
# List all products/materials for a profile
def list_products_for_profile(profile):
    """
    Accepts a Profile instance (accounts.Profile) and returns a list of ProductSchema
    entries. The migration and current DB use WorkerProduct which is related to
    accounts.WorkerProfile via workerID -> profileID. This function resolves the
    worker profile and lists WorkerProduct entries.
    """
    from .models import WorkerProduct
    from .schemas import ProductSchema

    # profile here is an instance of accounts.Profile. Find the WorkerProfile
    try:
        worker_profile = profile.workerprofile
    except Exception:
        # Older/alternate relation name or missing worker profile; try via WorkerProfile lookup
        from accounts.models import WorkerProfile
        worker_profile = WorkerProfile.objects.filter(profileID=profile).first()

    if not worker_profile:
        return []

    products = WorkerProduct.objects.filter(workerID=worker_profile).order_by("-createdAt")

    return [
        ProductSchema(
            productID=p.productID,
            name=p.productName,
            description=p.description,
            price=float(p.price) if p.price is not None else None,
            createdAt=p.createdAt.isoformat(),
            updatedAt=p.updatedAt.isoformat()
        )
        for p in products
    ]

# Delete a product/material by ID for a profile
def delete_product_for_profile(profile, product_id):
    product = profile.products.filter(productID=product_id).first()
    if not product:
        from ninja.responses import Response
        return Response({"error": "Product not found"}, status=404)
    product.delete()
    return {"success": True, "message": "Product deleted"}

from .models import WorkerProduct
from .schemas import ProductCreateSchema
from accounts.models import WorkerProfile


def add_product_to_profile(profile, product_data: ProductCreateSchema):
    """
    Create a WorkerProduct tied to the WorkerProfile that wraps the provided Profile.
    """
    # Resolve WorkerProfile for given Profile
    try:
        worker_profile = profile.workerprofile
    except Exception:
        worker_profile = WorkerProfile.objects.filter(profileID=profile).first()

    if not worker_profile:
        raise ValueError("WorkerProfile not found for this profile")

    product = WorkerProduct.objects.create(
        productName=product_data.name,
        description=product_data.description or "",
        price=product_data.price or 0,
        workerID=worker_profile
    )
    return product
