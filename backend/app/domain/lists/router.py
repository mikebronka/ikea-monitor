from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.domain.lists.models import ShoppingList, ListProduct
from app.domain.lists.schemas import ListCreate, ListProductAdd, ListResponse, ListUpdate
from app.domain.products.models import Product

router = APIRouter()


@router.get("/", response_model=list[ListResponse])
async def get_lists(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ShoppingList)
        .where(ShoppingList.is_active.is_(True))
        .options(selectinload(ShoppingList.items))
        .order_by(ShoppingList.created_at.desc())
    )
    lists = result.scalars().all()
    return [
        ListResponse(
            id=lst.id,
            name=lst.name,
            description=lst.description,
            product_count=len(lst.items),
            created_at=lst.created_at,
        )
        for lst in lists
    ]


@router.post("/", response_model=ListResponse, status_code=201)
async def create_list(data: ListCreate, db: AsyncSession = Depends(get_db)):
    lst = ShoppingList(**data.model_dump())
    db.add(lst)
    await db.commit()
    await db.refresh(lst)
    return ListResponse(
        id=lst.id,
        name=lst.name,
        description=lst.description,
        product_count=0,
        created_at=lst.created_at,
    )


@router.patch("/{list_id}", response_model=ListResponse)
async def update_list(list_id: int, data: ListUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ShoppingList).where(ShoppingList.id == list_id))
    lst = result.scalar_one()
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lst, field, value)
    await db.commit()
    await db.refresh(lst)
    return ListResponse(id=lst.id, name=lst.name, description=lst.description, product_count=0, created_at=lst.created_at)


@router.delete("/{list_id}", status_code=204)
async def delete_list(list_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ShoppingList).where(ShoppingList.id == list_id))
    lst = result.scalar_one()
    lst.is_active = False
    await db.commit()


@router.post("/{list_id}/products", status_code=201)
async def add_product_to_list(list_id: int, data: ListProductAdd, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Product).where(Product.article_no == data.article_no))
    product = result.scalar_one()
    item = ListProduct(list_id=list_id, product_id=product.id, quantity=data.quantity)
    db.add(item)
    await db.commit()
    return {"status": "added"}


@router.delete("/{list_id}/products/{product_id}", status_code=204)
async def remove_product_from_list(list_id: int, product_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ListProduct).where(ListProduct.list_id == list_id, ListProduct.product_id == product_id)
    )
    item = result.scalar_one()
    await db.delete(item)
    await db.commit()
