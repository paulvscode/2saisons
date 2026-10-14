-- AlterTable
ALTER TABLE "quiz_questions" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "timePerQuestion" INTEGER;
