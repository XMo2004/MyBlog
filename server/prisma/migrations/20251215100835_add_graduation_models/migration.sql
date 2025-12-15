-- CreateTable
CREATE TABLE "GraduationProject" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "subTitle" TEXT,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'author',
    "advisor" TEXT,
    "school" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "startDate" TIMESTAMP(3),
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isMain" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GraduationProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraduationTask" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "deadline" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraduationTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraduationLiterature" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "year" INTEGER,
    "type" TEXT NOT NULL DEFAULT 'paper',
    "source" TEXT,
    "url" TEXT,
    "fileUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'unread',
    "importance" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraduationLiterature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GraduationDefense" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "tags" TEXT,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "lastPracticed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraduationDefense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GraduationTask_projectId_idx" ON "GraduationTask"("projectId");

-- CreateIndex
CREATE INDEX "GraduationTask_status_idx" ON "GraduationTask"("status");

-- CreateIndex
CREATE INDEX "GraduationLiterature_projectId_idx" ON "GraduationLiterature"("projectId");

-- CreateIndex
CREATE INDEX "GraduationLiterature_status_idx" ON "GraduationLiterature"("status");

-- CreateIndex
CREATE INDEX "GraduationDefense_projectId_idx" ON "GraduationDefense"("projectId");

-- AddForeignKey
ALTER TABLE "GraduationTask" ADD CONSTRAINT "GraduationTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GraduationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraduationLiterature" ADD CONSTRAINT "GraduationLiterature_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GraduationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GraduationDefense" ADD CONSTRAINT "GraduationDefense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GraduationProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
