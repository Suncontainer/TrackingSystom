DELETE FROM "email_templates" WHERE "key" IN ('ready-to-ship', 'shipped', 'thank-you');--> statement-breakpoint
UPDATE "email_templates" SET
  "key" = 'procurement',
  "name" = 'Procurement',
  "subject_de" = 'Beschaffung für Ihren Auftrag {orderNumber} läuft',
  "body_de" = E'Hallo {customerName},\n\ndie Beschaffung für Ihren Auftrag {orderNumber} läuft.\n\nVoraussichtliche Lieferung: {deliveryDate}\n\nIhr Sun Container Team',
  "subject_en" = 'Procurement under way for your order {orderNumber}',
  "body_en" = E'Hello {customerName},\n\nprocurement for your order {orderNumber} is under way.\n\nEstimated delivery: {deliveryDate}\n\nYour Sun Container team',
  "updated_at" = now()
WHERE "key" = 'general-update';
