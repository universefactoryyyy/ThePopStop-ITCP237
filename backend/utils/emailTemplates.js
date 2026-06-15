const formatMoney = (amount) => `&#8369;${parseFloat(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const baseTemplate = (title, bodyContent) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff6f9;font-family:Segoe UI,Arial,sans-serif;color:#3d2035;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff6f9;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(232,68,122,0.12);">
        <tr>
          <td style="background:linear-gradient(135deg,#e8447a 0%,#ff5c8a 100%);padding:28px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;letter-spacing:1px;">The Pop Stop</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;">
            <h2 style="margin:0 0 16px;color:#e8447a;font-size:22px;">${title}</h2>
            ${bodyContent}
          </td>
        </tr>
        <tr>
          <td style="background:#3d2035;padding:18px;text-align:center;">
            <p style="margin:0;color:#fcd5e0;font-size:12px;">&copy; ${new Date().getFullYear()} The Pop Stop. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const buildOrderItemsTable = (order) => {
    let rows = '';
    if (order.OrderItems) {
        order.OrderItems.forEach((item) => {
            const name = item.Product ? item.Product.name : 'Product';
            const series = item.Product && item.Product.series
                ? `<div style="margin-top:4px;font-size:12px;line-height:1.4;color:#b07090;">${item.Product.series}</div>` : '';
            const subtotal = parseFloat(item.unit_price) * item.quantity;
            rows += `
            <tr>
              <td style="padding:12px;border-bottom:1px solid #fcd5e0;vertical-align:top;line-height:1.4;"><strong style="display:block;line-height:1.4;">${name}</strong>${series}</td>
              <td style="padding:12px;border-bottom:1px solid #fcd5e0;text-align:center;">${item.quantity}</td>
              <td style="padding:12px;border-bottom:1px solid #fcd5e0;text-align:right;">${formatMoney(item.unit_price)}</td>
              <td style="padding:12px;border-bottom:1px solid #fcd5e0;text-align:right;">${formatMoney(subtotal)}</td>
            </tr>`;
        });
    }
    return `
    <h3 style="color:#e8447a;margin:24px 0 12px;">Order Details</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#e8447a;color:#ffffff;">
          <th style="padding:12px;text-align:left;">Product</th>
          <th style="padding:12px;text-align:center;">Qty</th>
          <th style="padding:12px;text-align:right;">Price</th>
          <th style="padding:12px;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

const buildOrderTotals = (order) => {
    const subtotal = parseFloat(order.subtotal_amount || order.total_amount || 0);
    const discount = parseFloat(order.discount_amount || 0);
    const total = parseFloat(order.total_amount || 0);
    let discountRow = '';
    if (discount > 0) {
        discountRow = `<tr><td style="padding:6px 0;color:#1a7a4a;">Discount${order.discount_code ? ` (${order.discount_code})` : ''}</td><td style="padding:6px 0;text-align:right;color:#1a7a4a;">-${formatMoney(discount)}</td></tr>`;
    }
    return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;font-size:14px;">
      <tr><td style="padding:6px 0;">Subtotal</td><td style="padding:6px 0;text-align:right;">${formatMoney(subtotal)}</td></tr>
      ${discountRow}
      <tr><td style="padding:10px 0;font-size:18px;font-weight:bold;color:#e8447a;">Grand Total</td><td style="padding:10px 0;text-align:right;font-size:18px;font-weight:bold;color:#e8447a;">${formatMoney(total)}</td></tr>
    </table>`;
};

exports.orderConfirmationEmail = (user, order) => {
    const receiptUrl = `${process.env.BASE_URL || 'http://localhost:4000'}/api/v1/orders/${order.id}/receipt`;
    const body = `
      <p style="margin:0 0 12px;font-size:15px;">Dear <strong>${user.name}</strong>,</p>
      <p style="margin:0 0 20px;font-size:15px;">Thank you for your order! Your order <strong>#${order.id}</strong> has been placed successfully.</p>
      <div style="background:#ffe0ec;border-left:4px solid #e8447a;padding:16px 20px;border-radius:8px;margin-bottom:20px;">
        <strong style="color:#e8447a;">Status: ${order.status}</strong>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${receiptUrl}" style="display:inline-block;background:linear-gradient(135deg,#e8447a 0%,#ff5c8a 100%);color:#ffffff;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;">
          &#128196; Download Receipt PDF
        </a>
      </div>
      ${buildOrderItemsTable(order)}
      ${buildOrderTotals(order)}
      <div style="background:#e8f4fd;border-radius:8px;padding:16px;margin-top:20px;">
        <strong style="color:#1565c0;">&#128205; Shipping Address:</strong><br>
        <span style="color:#1976d2;">${(order.shipping_address || '').replace(/\n/g, '<br>')}</span>
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#7a4060;">Payment Method: <strong>${order.payment_method || 'N/A'}</strong></p>
      <p style="margin:16px 0 0;font-size:14px;">Thank you for shopping with The Pop Stop!</p>
      <p style="margin:12px 0 0;font-size:13px;color:#7a4060;">Your PDF receipt is attached to this email for your records.</p>`;
    return baseTemplate('Order Confirmed', body);
};

exports.orderStatusUpdateEmail = (user, order, status) => {
    const receiptUrl = `${process.env.BASE_URL || 'http://localhost:4000'}/api/v1/orders/${order.id}/receipt`;
    const body = `
      <p style="margin:0 0 12px;font-size:15px;">Dear <strong>${user.name}</strong>,</p>
      <p style="margin:0 0 20px;font-size:15px;">Your order <strong>#${order.id}</strong> status has been updated to:</p>
      <div style="background:#ffe0ec;border-left:4px solid #e8447a;padding:16px 20px;border-radius:8px;margin-bottom:20px;">
        <strong style="color:#e8447a;font-size:16px;">Status: ${status}</strong>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="${receiptUrl}" style="display:inline-block;background:linear-gradient(135deg,#e8447a 0%,#ff5c8a 100%);color:#ffffff;font-weight:bold;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;">
          &#128196; Download Receipt PDF
        </a>
      </div>
      ${buildOrderItemsTable(order)}
      ${buildOrderTotals(order)}
      <div style="background:#e8f4fd;border-radius:8px;padding:16px;margin-top:20px;">
        <strong style="color:#1565c0;">&#128205; Shipping Address:</strong><br>
        <span style="color:#1976d2;">${(order.shipping_address || '').replace(/\n/g, '<br>')}</span>
      </div>
      <p style="margin:24px 0 0;font-size:14px;">Thank you for shopping with The Pop Stop!</p>
      <p style="margin:12px 0 0;font-size:13px;color:#7a4060;">Your updated PDF receipt is attached to this email.</p>
      <p style="margin:8px 0 0;font-size:13px;color:#b07090;">If you have any questions, please contact us.</p>`;
    return baseTemplate('Order Status Update', body);
};
