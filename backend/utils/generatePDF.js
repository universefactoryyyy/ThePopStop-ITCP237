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
        const summaryHeight = 76;
        drawRoundedRect(doc, margin, y, contentWidth, summaryHeight, 8, COLORS.pink50, COLORS.border);

        const colW = contentWidth / 2 - 12;
        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('ORDER ID', margin + 14, y + 12, { lineBreak: false });
        doc.fillColor(COLORS.textDark).font('Helvetica-Bold').fontSize(12)
            .text(`#${order.id}`, margin + 14, y + 22, { lineBreak: false });

        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('STATUS', margin + 14 + colW, y + 12, { lineBreak: false });
        doc.fillColor(COLORS.pink500).font('Helvetica-Bold').fontSize(11)
            .text(order.status || 'Pending', margin + 14 + colW, y + 22, { lineBreak: false });

        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('DATE', margin + 14, y + 44, { lineBreak: false });
        doc.fillColor(COLORS.textDark).font('Helvetica').fontSize(9)
            .text(new Date(order.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }), margin + 14, y + 54, { width: colW, lineBreak: false });

        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('PAYMENT', margin + 14 + colW, y + 44, { lineBreak: false });
        doc.fillColor(COLORS.textDark).font('Helvetica').fontSize(9)
            .text(order.payment_method || 'N/A', margin + 14 + colW, y + 54, { width: colW - 8, lineBreak: false });

        y += summaryHeight + 12;

        // Shipping address — fixed height so text never flows to a new page
        const shipHeight = 48;
        drawRoundedRect(doc, margin, y, contentWidth, shipHeight, 8, COLORS.white, COLORS.border);
        doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8)
            .text('SHIPPING ADDRESS', margin + 14, y + 10, { lineBreak: false });
        doc.fillColor(COLORS.textDark).font('Helvetica').fontSize(9)
            .text((order.shipping_address || 'N/A').replace(/\n/g, ' · '), margin + 14, y + 22, {
                width: contentWidth - 28,
                height: 22,
                lineBreak: true
            });

        y += shipHeight + 14;

        // Items table
        doc.fillColor(COLORS.textDark).font('Helvetica-Bold').fontSize(11)
            .text('Order Items', margin, y, { lineBreak: false });
        y += 16;

        const colProduct = contentWidth * 0.46;
        const colQty = contentWidth * 0.12;
        const colPrice = contentWidth * 0.21;
        const colSub = contentWidth * 0.21;

        doc.rect(margin, y, contentWidth, 22).fill(COLORS.pink500);
        doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8);
        doc.text('Product', margin + 8, y + 6, { width: colProduct - 8, lineBreak: false });
        doc.text('Qty', margin + colProduct, y + 6, { width: colQty, align: 'center', lineBreak: false });
        doc.text('Price', margin + colProduct + colQty, y + 6, { width: colPrice, align: 'right', lineBreak: false });
        doc.text('Subtotal', margin + colProduct + colQty + colPrice, y + 6, { width: colSub - 8, align: 'right', lineBreak: false });

        y += 22;

        const items = order.OrderItems || [];
        items.forEach((item, index) => {
            const rowH = 32;
            const bg = index % 2 === 0 ? COLORS.white : COLORS.pink50;
            doc.rect(margin, y, contentWidth, rowH).fill(bg);
            doc.rect(margin, y + rowH - 1, contentWidth, 1).fill(COLORS.border);

            const name = item.Product ? item.Product.name : 'Product';
            const series = item.Product && item.Product.series ? item.Product.series : '';
            const unitPrice = parseFloat(item.unit_price);
            const subtotal = unitPrice * item.quantity;

            doc.fillColor(COLORS.textDark).font('Helvetica-Bold').fontSize(8)
                .text(name, margin + 8, y + 7, { width: colProduct - 12, height: 10, lineBreak: false });
            if (series) {
                doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(7)
                    .text(series, margin + 8, y + 18, { width: colProduct - 12, lineBreak: false });
            }

            doc.fillColor(COLORS.textDark).font('Helvetica').fontSize(8)
                .text(String(item.quantity), margin + colProduct, y + 11, { width: colQty, align: 'center', lineBreak: false });
            doc.text(formatPeso(unitPrice), margin + colProduct + colQty, y + 11, { width: colPrice, align: 'right', lineBreak: false });
            doc.font('Helvetica-Bold')
                .text(formatPeso(subtotal), margin + colProduct + colQty + colPrice, y + 11, { width: colSub - 8, align: 'right', lineBreak: false });

            y += rowH;
        });

        y += 12;

        // Totals box
        const totalsW = 210;
        const totalsX = margin + contentWidth - totalsW;
        const hasDiscount = parseFloat(order.discount_amount || 0) > 0;
        const totalsH = hasDiscount ? 96 : 78;
        drawRoundedRect(doc, totalsX, y, totalsW, totalsH, 8, COLORS.pink50, COLORS.border);

        const subtotal = parseFloat(order.subtotal_amount || order.total_amount || 0);
        const discount = parseFloat(order.discount_amount || 0);
        const total = parseFloat(order.total_amount || 0);

        let ty = y + 12;
        const drawTotalRow = (label, value, bold, valueColor) => {
            doc.fillColor(COLORS.textMedium).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 8)
                .text(label, totalsX + 12, ty, { width: 80, lineBreak: false });
            doc.fillColor(valueColor || COLORS.textDark).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 8)
                .text(value, totalsX + 12, ty, { width: totalsW - 24, align: 'right', lineBreak: false });
            ty += bold ? 20 : 14;
        };

        drawTotalRow('Subtotal', formatPeso(subtotal), false);
        if (hasDiscount) {
            const label = order.discount_code ? `Discount (${order.discount_code})` : 'Discount';
            drawTotalRow(label, `- ${formatPeso(discount)}`, false, COLORS.success);
        }
        doc.moveTo(totalsX + 12, ty - 2).lineTo(totalsX + totalsW - 12, ty - 2).strokeColor(COLORS.border).lineWidth(1).stroke();
        drawTotalRow('Grand Total', formatPeso(total), true, COLORS.pink500);

        // Add footer to every page using bufferPages and flushPages
        const footers = () => {
            const pageCount = doc.bufferedPageRange().count;
            for (let i = 0; i < pageCount; i++) {
                doc.switchToPage(i);
                const footerH = 44;
                const footerY = pageHeight - margin - footerH;
                doc.rect(margin, footerY, contentWidth, footerH).fill(COLORS.textDark);
                doc.fillColor(COLORS.pink100).font('Helvetica').fontSize(8)
                    .text('Thank you for shopping with The Pop Stop!', margin, footerY + 10, { align: 'center', width: contentWidth, lineBreak: false });
                doc.fillColor(COLORS.textLight).fontSize(7)
                    .text(`© ${new Date().getFullYear()} The Pop Stop. All rights reserved.`, margin, footerY + 26, { align: 'center', width: contentWidth, lineBreak: false });
            }
        };

        footers();
        doc.end();
    });
};

module.exports = { generateOrderReceipt };
