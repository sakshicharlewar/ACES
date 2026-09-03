from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models import Admin, GalleryAlbum
from schemas import GalleryAlbumCreate, GalleryAlbumUpdate, GalleryAlbumOut
from auth import get_current_admin

router = APIRouter(prefix="/admin/api/gallery", tags=["Gallery"])


@router.get("/", response_model=list[GalleryAlbumOut])
async def list_albums(
    event_id: int = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin),
):
    q = select(GalleryAlbum)
    if event_id:
        q = q.where(GalleryAlbum.event_id == event_id)
    q = q.order_by(GalleryAlbum.created_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=GalleryAlbumOut, status_code=201)
async def create_album(body: GalleryAlbumCreate, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    album = GalleryAlbum(**body.model_dump())
    db.add(album)
    await db.commit()
    await db.refresh(album)
    return album


@router.get("/{album_id}", response_model=GalleryAlbumOut)
async def get_album(album_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(GalleryAlbum).where(GalleryAlbum.id == album_id))
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    return album


@router.patch("/{album_id}", response_model=GalleryAlbumOut)
async def update_album(album_id: int, body: GalleryAlbumUpdate, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(GalleryAlbum).where(GalleryAlbum.id == album_id))
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(album, k, v)
    await db.commit()
    await db.refresh(album)
    return album


@router.delete("/{album_id}")
async def delete_album(album_id: int, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(GalleryAlbum).where(GalleryAlbum.id == album_id))
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    await db.delete(album)
    await db.commit()
    return {"success": True}


@router.post("/{album_id}/images")
async def add_images(album_id: int, body: dict, db: AsyncSession = Depends(get_db), admin: Admin = Depends(get_current_admin)):
    result = await db.execute(select(GalleryAlbum).where(GalleryAlbum.id == album_id))
    album = result.scalar_one_or_none()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    new_images = body.get("images", [])
    album.images = (album.images or []) + new_images
    await db.commit()
    return {"success": True, "total_images": len(album.images)}
