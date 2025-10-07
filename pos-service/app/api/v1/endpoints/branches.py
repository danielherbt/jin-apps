from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ....db.session import get_db
from ....models.branch import Branch
from ....schemas.branch import BranchCreate, BranchUpdate, BranchResponse
from ....core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=BranchResponse)
async def create_branch(
    branch: BranchCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_branch = Branch(**branch.dict())
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)
    return db_branch

@router.get("/", response_model=List[BranchResponse])
async def get_branches(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    branches = db.query(Branch).offset(skip).limit(limit).all()
    return branches

@router.get("/{branch_id}", response_model=BranchResponse)
async def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return branch

@router.put("/{branch_id}", response_model=BranchResponse)
async def update_branch(
    branch_id: int,
    branch_update: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    update_data = branch_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(branch, field, value)

    db.commit()
    db.refresh(branch)
    return branch