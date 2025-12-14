-- CreateTable
CREATE TABLE `Participant` (
    `id` VARCHAR(191) NOT NULL,
    `marca_temporal` VARCHAR(255) NOT NULL,
    `correo` VARCHAR(255) NOT NULL,
    `nombres_apellidos` VARCHAR(255) NOT NULL,
    `documento_identidad` VARCHAR(50) NOT NULL,
    `genero` VARCHAR(20) NOT NULL,
    `numero_celular` VARCHAR(20) NOT NULL,
    `regimen_laboral` VARCHAR(100) NOT NULL,
    `organo_unidad` VARCHAR(255) NOT NULL,
    `cargo` VARCHAR(255) NOT NULL,
    `encuesta_satisfaccion` TEXT NOT NULL,
    `qr_code` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `eventId` VARCHAR(191) NOT NULL,

    INDEX `Participant_eventId_idx`(`eventId`),
    INDEX `Participant_correo_idx`(`correo`),
    INDEX `Participant_documento_identidad_idx`(`documento_identidad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `eventDate` VARCHAR(100) NOT NULL,
    `issueDate` VARCHAR(100) NOT NULL,
    `location` VARCHAR(100) NOT NULL,
    `duration` VARCHAR(100) NOT NULL,
    `footerText` TEXT NOT NULL,
    `logoLeft` TEXT NULL,
    `logoRight` TEXT NULL,
    `signatures` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Event_title_idx`(`title`),
    INDEX `Event_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Participant` ADD CONSTRAINT `Participant_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
