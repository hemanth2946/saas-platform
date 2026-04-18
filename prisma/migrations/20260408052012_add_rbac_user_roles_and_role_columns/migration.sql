/*
  Warnings:

  - You are about to drop the column `roleId` on the `invites` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('QUICK', 'SERVICE_BASED');

-- DropForeignKey
ALTER TABLE "invites" DROP CONSTRAINT "invites_roleId_fkey";

-- AlterTable
ALTER TABLE "invites" DROP COLUMN "roleId",
ADD COLUMN     "roleIds" TEXT[];

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "description" TEXT,
ADD COLUMN     "serviceKey" TEXT,
ADD COLUMN     "type" "RoleType" NOT NULL DEFAULT 'QUICK';

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateIndex
CREATE INDEX "user_roles_userId_idx" ON "user_roles"("userId");

-- CreateIndex
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
