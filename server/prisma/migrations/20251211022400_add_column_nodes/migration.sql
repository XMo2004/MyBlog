-- AlterTable
ALTER TABLE "Post" ADD COLUMN "summary" TEXT;

-- CreateTable
CREATE TABLE "ColumnNode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parentId" INTEGER,
    "columnId" INTEGER NOT NULL,
    "postId" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ColumnNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ColumnNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ColumnNode_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ColumnNode_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
