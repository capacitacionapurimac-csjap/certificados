-- AlterTable
ALTER TABLE `Participant` ADD COLUMN `emailError` VARCHAR(191) NULL,
    ADD COLUMN `emailSent` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `emailSentAt` DATETIME(3) NULL;
