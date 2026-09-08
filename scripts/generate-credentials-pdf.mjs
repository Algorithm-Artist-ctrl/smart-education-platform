// scripts/generate-credentials-pdf.mjs
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function createPDF() {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 Size: 595 x 842 pt
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontMono = await pdfDoc.embedFont(StandardFonts.CourierBold);

  // Colors
  const primaryColor = rgb(79 / 255, 70 / 255, 229 / 255); // Indigo #4f46e5
  const darkColor = rgb(15 / 255, 23 / 255, 42 / 255);     // Slate 900
  const grayColor = rgb(100 / 255, 116 / 255, 139 / 255);  // Slate 500
  const lightBg = rgb(248 / 255, 250 / 255, 252 / 255);    // Slate 50
  const cardBorder = rgb(226 / 255, 232 / 255, 240 / 255); // Slate 200
  const white = rgb(1, 1, 1);
  const accentGreen = rgb(16 / 255, 185 / 255, 129 / 255);

  let y = height - 50;

  // Header Banner
  page.drawRectangle({
    x: 40,
    y: y - 55,
    width: width - 80,
    height: 70,
    color: rgb(238 / 255, 242 / 255, 255 / 255),
    borderColor: rgb(199 / 255, 210 / 255, 254 / 255),
    borderWidth: 1,
  });

  page.drawText('SMART EDUCATION PLATFORM', {
    x: 55,
    y: y - 15,
    size: 16,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText('Official Login Credentials & Access Guide', {
    x: 55,
    y: y - 35,
    size: 11,
    font: fontRegular,
    color: darkColor,
  });

  page.drawText(`Generated: ${new Date().toLocaleDateString('en-GB')}`, {
    x: width - 180,
    y: y - 25,
    size: 9,
    font: fontRegular,
    color: grayColor,
  });

  y -= 80;

  // Project Info Box
  page.drawText('System Configuration', {
    x: 40,
    y: y,
    size: 12,
    font: fontBold,
    color: darkColor,
  });

  y -= 18;
  const configText = [
    '• Application URL: http://localhost:3000',
    '• Backend Platform: Supabase PostgreSQL (Project ID: gzejdomnlxlxkhzhxwnc)',
    '• GitHub Repository: https://github.com/Algorithm-Artist-ctrl/smart-education-platform.git',
    '• Authentication: Live Supabase Auth (Active & Verified)'
  ];

  for (const line of configText) {
    page.drawText(line, {
      x: 45,
      y: y,
      size: 9,
      font: fontRegular,
      color: grayColor,
    });
    y -= 14;
  }

  y -= 12;

  // Credentials Section
  page.drawText('Role-Based User Credentials', {
    x: 40,
    y: y,
    size: 12,
    font: fontBold,
    color: darkColor,
  });
  y -= 8;

  const credentials = [
    {
      role: 'STUDENT',
      name: 'Aarav Sharma',
      email: 'student@smartedu.com',
      pass: 'Student@12345',
      desc: 'Access to Student Dashboard, Adaptive Diagnostic Quizzes, Study Planner, Weak Topics & Revision.',
      badgeColor: rgb(238 / 255, 242 / 255, 255 / 255),
      textColor: primaryColor,
    },
    {
      role: 'TEACHER',
      name: 'Dr. Priya Verma',
      email: 'teacher@smartedu.com',
      pass: 'Teacher@12345',
      desc: 'Access to Teacher Command Center, Assignment Authoring, Curriculum Publishing, and Class Analytics.',
      badgeColor: rgb(236 / 255, 253 / 255, 245 / 255),
      textColor: rgb(5 / 255, 150 / 255, 105 / 255),
    },
    {
      role: 'PARENT',
      name: 'Rajesh Sharma',
      email: 'parent@smartedu.com',
      pass: 'Parent@12345',
      desc: 'Access to Parent Portal. View linked child academic progress, attendance & weak concepts (RLS isolated).',
      badgeColor: rgb(254 / 255, 243 / 255, 199 / 255),
      textColor: rgb(217 / 255, 119 / 255, 6 / 255),
    },
    {
      role: 'ADMIN',
      name: 'Vikram Malhotra',
      email: 'admin@smartedu.com',
      pass: 'Admin@12345',
      desc: 'Access to Institution Administration. Cohorts, classes, subjects, enrollment, and user directory.',
      badgeColor: rgb(241 / 255, 245 / 255, 249 / 255),
      textColor: rgb(71 / 255, 85 / 255, 105 / 255),
    },
    {
      role: 'SUPER ADMIN',
      name: 'System Administrator',
      email: 'superadmin@smartedu.com',
      pass: 'SuperAdmin@12345',
      desc: 'Platform-level governance. Multi-institution management, security telemetry, and audit logs.',
      badgeColor: rgb(255 / 255, 241 / 255, 242 / 255),
      textColor: rgb(225 / 255, 29 / 255, 72 / 255),
    },
  ];

  for (const cred of credentials) {
    const cardHeight = 62;
    page.drawRectangle({
      x: 40,
      y: y - cardHeight,
      width: width - 80,
      height: cardHeight,
      color: white,
      borderColor: cardBorder,
      borderWidth: 1,
    });

    // Badge
    page.drawRectangle({
      x: 48,
      y: y - 22,
      width: 85,
      height: 16,
      color: cred.badgeColor,
    });
    page.drawText(cred.role, {
      x: 54,
      y: y - 18,
      size: 8,
      font: fontBold,
      color: cred.textColor,
    });

    // Name
    page.drawText(cred.name, {
      x: 142,
      y: y - 18,
      size: 9.5,
      font: fontBold,
      color: darkColor,
    });

    // Email
    page.drawText('Email:', {
      x: 48,
      y: y - 38,
      size: 8.5,
      font: fontRegular,
      color: grayColor,
    });
    page.drawText(cred.email, {
      x: 82,
      y: y - 38,
      size: 8.5,
      font: fontMono,
      color: darkColor,
    });

    // Password
    page.drawText('Password:', {
      x: 270,
      y: y - 38,
      size: 8.5,
      font: fontRegular,
      color: grayColor,
    });
    page.drawText(cred.pass, {
      x: 325,
      y: y - 38,
      size: 8.5,
      font: fontMono,
      color: primaryColor,
    });

    // Description
    page.drawText(cred.desc, {
      x: 48,
      y: y - 54,
      size: 7.5,
      font: fontRegular,
      color: grayColor,
    });

    y -= (cardHeight + 8);
  }

  y -= 8;

  // Activation Steps Box
  page.drawRectangle({
    x: 40,
    y: y - 80,
    width: width - 80,
    height: 80,
    color: rgb(240 / 255, 253 / 255, 244 / 255),
    borderColor: rgb(187 / 255, 247 / 255, 208 / 255),
    borderWidth: 1,
  });

  page.drawText('One-Time Database Schema Activation (Required for Data Tables):', {
    x: 52,
    y: y - 20,
    size: 9,
    font: fontBold,
    color: rgb(22 / 255, 101 / 255, 52 / 255),
  });

  const steps = [
    '1. Open Supabase Dashboard: https://supabase.com/dashboard/project/gzejdomnlxlxkhzhxwnc/sql/new',
    '2. Open the file "supabase/full_setup.sql" from your repository, copy its full content, and paste it into SQL Editor.',
    '3. Click "RUN". This creates all 20+ tables, RLS security policies, storage buckets, and seeds the full curriculum.',
    '4. Start the app with "npm run dev" and log in with any of the credentials above!'
  ];

  let stepY = y - 34;
  for (const s of steps) {
    page.drawText(s, {
      x: 52,
      y: stepY,
      size: 7.5,
      font: fontRegular,
      color: rgb(20 / 255, 83 / 255, 45 / 255),
    });
    stepY -= 11;
  }

  // Footer
  page.drawText('Confidential • Smart Education Platform • Keep these credentials secure', {
    x: width / 2 - 145,
    y: 25,
    size: 8,
    font: fontRegular,
    color: grayColor,
  });

  const pdfBytes = await pdfDoc.save();

  // Target paths
  const localPdfPath = path.join(process.cwd(), 'Smart_Education_Login_Credentials.pdf');
  const artifactDir = '/Users/tarun/.gemini/antigravity/brain/3a7ebcca-da59-4e75-bc8a-6a88c0cce55b';
  const artifactPdfPath = path.join(artifactDir, 'Smart_Education_Login_Credentials.pdf');

  fs.writeFileSync(localPdfPath, pdfBytes);
  console.log(`Saved PDF to: ${localPdfPath}`);

  if (fs.existsSync(artifactDir)) {
    fs.writeFileSync(artifactPdfPath, pdfBytes);
    console.log(`Saved PDF copy to artifacts: ${artifactPdfPath}`);
  }
}

createPDF().catch(console.error);
