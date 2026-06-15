const PDFDocument = require('pdfkit');

const COLORS = {
    pink500: '#e8447a',
    pink100: '#ffe0ec',
    pink50: '#fff6f9',
    border: '#fcd5e0',
    textDark: '#3d2035',
    textMedium: '#7a4060',
    textLight: '#b07090',
    success: '#1a7a4a',
    white: '#ffffff'
};

const formatPeso = (amount) =>
    `PHP ${parseFloat(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const drawRoundedRect = (doc, x, y, w, h, r, fill, stroke) => {
    if (fill && stroke) {
        doc.roundedRect(x, y, w, h, r).fillAndStroke(fill, stroke);
        return;
    }
    if (fill) doc.roundedRect(x, y, w, h, r).fill(fill);
    else if (stroke) doc.roundedRect(x, y, w, h, r).stroke(stroke);
};

const generateOrderReceipt = (order) => {
    return new Promise((resolve, reject) => {
        const margin = 48;
        const doc = new PDFDocument({ margin, size: 'A4', bufferPages: true });
        const buffers = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const contentWidth = pageWidth - margin * 2;

        // Header band
        doc.rect(0, 0, pageWidth, 80).fill(COLORS.pink500);
        doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(22)
            .text('THE POP STOP', margin, 22, { align: 'center', width: contentWidth, lineBreak: false });
        doc.font('Helvetica').fontSize(10)
            .text('Order Receipt', margin, 50, { align: 'center', width: contentWidth, lineBreak: false });

        let y = 96;

        // Order summary card
        const summaryHeight = 88;
        drawRoundedRect(doc, margin, y, contentWidth, summaryHeight, 8, COLORS.pink50, COLORS.border);

        const colW = contentWidth / 2 - 12;
        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('ORDER ID', margin + 14, y + 12, { lineBreak: false });
        doc.fillColor(COLORS.textDark).font('Helvetica-Bold').fontSize(12)
            .text(`#${order.id}`, margin + 14, y + 24, { lineBreak: false });

        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('STATUS', margin + 14 + colW, y + 12, { lineBreak: false });
        doc.fillColor(COLORS.pink500).font('Helvetica-Bold').fontSize(11)
            .text(order.status || 'Pending', margin + 14 + colW, y + 24, { width: colW - 8, lineBreak: true });

        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('DATE', margin + 14, y + 50, { lineBreak: false });
        doc.fillColor(COLORS.textDark).font('Helvetica').fontSize(9)
            .text(new Date(order.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 14, y + 62, { width: colW, lineBreak: false });

        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('PAYMENT', margin + 14 + colW, y + 50, { lineBreak: false });
        doc.fillColor(COLORS.textDark).font('Helvetica').fontSize(9)
            .text(order.payment_method || 'N/A', margin + 14 + colW, y + 62, { width: colW - 8, lineBreak: true });

        y += summaryHeight + 16;

        // Shipping address — dynamic height
        const addressText = (order.shipping_address || 'N/A').replace(/\n/g, ' · ');
        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8);
        const addressLines = doc.heightOfString(addressText, { width: contentWidth - 28, lineBreak: true });
        const shipHeight = 24 + Math.max(addressLines, 18);
        drawRoundedRect(doc, margin, y, contentWidth, shipHeight, 8, COLORS.white, COLORS.border);
        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('SHIPPING ADDRESS', margin + 14, y + 10, { lineBreak: false });
        doc.fillColor(COLORS.textDark).font('Helvetica').fontSize(9)
            .text(addressText, margin + 14, y + 24, {
                width: contentWidth - 28,
                lineBreak: true
            });

        y += shipHeight + 18;

        // Items table
        doc.fillColor(COLORS.textDark).font('Helvetica-Bold').fontSize(11)
            .text('Order Items', margin, y, { lineBreak: false });
        y += 16;

        const colProduct = contentWidth * 0.46;
        const colQty = contentWidth * 0.12;
        const colPrice = contentWidth * 0.21;
        const colSub = contentWidth * 0.21;

        doc.rect(margin, y, contentWidth, 24).fill(COLORS.pink500);
        doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8);
        doc.text('Product', margin + 8, y + 8, { width: colProduct - 8, lineBreak: false });
        doc.text('Qty', margin + colProduct, y + 8, { width: colQty, align: 'center', lineBreak: false });
        doc.text('Price', margin + colProduct + colQty, y + 8, { width: colPrice, align: 'right', lineBreak: false });
        doc.text('Subtotal', margin + colProduct + colQty + colPrice, y + 8, { width: colSub - 8, align: 'right', lineBreak: false });

        y += 24;

        const items = order.OrderItems || [];
        items.forEach((item, index) => {
            const name = item.Product ? item.Product.name : 'Product';
            const series = item.Product && item.Product.series ? item.Product.series : '';
            const unitPrice = parseFloat(item.unit_price);
            const subtotal = unitPrice * item.quantity;

            // Calculate row height based on content
            const nameHeight = doc.heightOfString(name, { width: colProduct - 12, font: 'Helvetica-Bold', fontSize: 8, lineBreak: true });
            const seriesHeight = series ? doc.heightOfString(series, { width: colProduct - 12, font: 'Helvetica', fontSize: 7, lineBreak: true }) : 0;
            const rowH = Math.max(40, 16 + nameHeight + (series ? 4 + seriesHeight : 0));

            const bg = index % 2 === 0 ? COLORS.white : COLORS.pink50;
            doc.rect(margin, y, contentWidth, rowH).fill(bg);
            doc.rect(margin, y + rowH - 1, contentWidth, 1).fill(COLORS.border);

            let productY = y + 10;

            doc.fillColor(COLORS.textDark).font('Helvetica-Bold').fontSize(8)
                .text(name, margin + 8, productY, { width: colProduct - 12, lineBreak: true });
            productY += nameHeight + 2;
            if (series) {
                doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(7)
                    .text(series, margin + 8, productY, { width: colProduct - 12, lineBreak: true });
            }

            doc.fillColor(COLORS.textDark).font('Helvetica').fontSize(8)
                .text(String(item.quantity), margin + colProduct, y + rowH / 2 - 4, { width: colQty, align: 'center', lineBreak: false });
            doc.text(formatPeso(unitPrice), margin + colProduct + colQty, y + rowH / 2 - 4, { width: colPrice, align: 'right', lineBreak: false });
            doc.font('Helvetica-Bold')
                .text(formatPeso(subtotal), margin + colProduct + colQty + colPrice, y + rowH / 2 - 4, { width: colSub - 8, align: 'right', lineBreak: false });

            y += rowH;
        });

        y += 16;

        // Totals box
        const totalsW = 230;
        const totalsX = margin + contentWidth - totalsW;
        const hasDiscount = parseFloat(order.discount_amount || 0) > 0;
        const totalsH = hasDiscount ? 104 : 84;
        drawRoundedRect(doc, totalsX, y, totalsW, totalsH, 8, COLORS.pink50, COLORS.border);

        const subtotal = parseFloat(order.subtotal_amount || order.total_amount || 0);
        const discount = parseFloat(order.discount_amount || 0);
        const total = parseFloat(order.total_amount || 0);

        let ty = y + 16;
        const drawTotalRow = (label, value, bold, valueColor) => {
            doc.fillColor(COLORS.textMedium).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 8)
                .text(label, totalsX + 14, ty, { width: 90, lineBreak: true });
            doc.fillColor(valueColor || COLORS.textDark).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 8)
                .text(value, totalsX + 14, ty, { width: totalsW - 28, align: 'right', lineBreak: false });
            ty += bold ? 22 : 16;
        };

        drawTotalRow('Subtotal', formatPeso(subtotal), false);
        if (hasDiscount) {
            const label = order.discount_code ? `Discount (${order.discount_code})` : 'Discount';
            drawTotalRow(label, `- ${formatPeso(discount)}`, false, COLORS.success);
        }
        doc.moveTo(totalsX + 14, ty - 4).lineTo(totalsX + totalsW - 14, ty - 4).strokeColor(COLORS.border).lineWidth(1).stroke();
        drawTotalRow('Grand Total', formatPeso(total), true, COLORS.pink500);

        // Add footer to every page using bufferPages and flushPages
        const footers = () => {
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                const footerH = 52;
                const footerY = pageHeight - margin - footerH;
                doc.rect(margin, footerY, contentWidth, footerH).fill(COLORS.textDark);
                doc.fillColor(COLORS.pink100).font('Helvetica').fontSize(8)
                    .text('Thank you for shopping with The Pop Stop!', margin, footerY + 14, { align: 'center', width: contentWidth, lineBreak: false });
                doc.fillColor(COLORS.textLight).fontSize(7)
                    .text(`© ${new Date().getFullYear()} The Pop Stop. All rights reserved.`, margin, footerY + 30, { align: 'center', width: contentWidth, lineBreak: false });
            }
        };

        footers();
        doc.end();
    });
};

module.exports = { generateOrderReceipt };
