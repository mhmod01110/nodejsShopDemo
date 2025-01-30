const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateInvoice(order, invoicePath) {
    return new Promise((resolve, reject) => {
        try {
            // Create a document with better margins
            const doc = new PDFDocument({
                margins: {
                    top: 50,
                    bottom: 50,
                    left: 50,
                    right: 50
                }
            });
            const writeStream = fs.createWriteStream(invoicePath);

            // Handle stream errors
            writeStream.on('error', (err) => {
                console.error('Error writing invoice:', err);
                reject(err);
            });

            // Pipe the PDF into the write stream
            doc.pipe(writeStream);

            // Add company logo or name
            doc.fontSize(24)
               .font('Helvetica-Bold')
               .text('SHOP NAME', { align: 'center' });
            
            doc.moveDown(2);  // More space after company name

            // Add the header
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text('Invoice', { align: 'center' });
            
            doc.moveDown(1.5);  // More space after invoice title

            // Add invoice details
            doc.fontSize(12)
               .font('Helvetica')
               .text(`Invoice ID: ${order._id || 'N/A'}`, { align: 'right' })
               .text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, { align: 'right' });
            
            doc.moveDown(2);  // More space after invoice details

            // Add customer info
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('Customer Information');
            
            doc.moveDown(0.5);  // Space before customer email
            
            doc.fontSize(12)
               .font('Helvetica')
               .text(`Email: ${order.userId?.email || 'N/A'}`);
            
            doc.moveDown(2);  // More space after customer info

            // Add the items table header
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('Order Items');
            
            doc.moveDown(1.5);  // More space before table header

            // Define column positions and widths
            const columns = {
                item: { x: 50, width: 220, label: 'Item' },
                quantity: { x: 290, width: 80, label: 'Quantity' },
                price: { x: 390, width: 80, label: 'Price' },
                total: { x: 490, width: 80, label: 'Total' }
            };

            // Table header
            const headerY = doc.y;
            doc.fontSize(12)
               .font('Helvetica-Bold');

            // Draw all headers at the same Y position
            Object.values(columns).forEach(col => {
                const align = col.label === 'Item' ? 'left' : 'center';
                doc.text(col.label, 
                    col.x, 
                    headerY,
                    { width: col.width, align: align }
                );
            });

            // Draw header line with more spacing
            doc.moveDown(1);  // Space before header line
            doc.moveTo(50, doc.y)
               .lineTo(550, doc.y)
               .stroke();
            doc.moveDown(1);  // Space after header line

            // Add the items
            if (Array.isArray(order.items)) {
                order.items.forEach((item, index) => {
                    if (item && item.product) {
                        // Add extra space between items
                        if (index > 0) {
                            doc.moveDown(1);
                        }

                        const rowY = doc.y;
                        
                        // Calculate the height needed for the product title
                        const titleHeight = doc.fontSize(12)
                            .font('Helvetica')
                            .heightOfString(item.product.title || 'N/A', {
                                width: columns.item.width,
                                align: 'left'
                            });

                        // Draw all columns at the same Y position
                        // Item name
                        doc.text(item.product.title || 'N/A', 
                            columns.item.x, 
                            rowY, 
                            { width: columns.item.width, align: 'left' }
                        );

                        // Quantity (vertically centered relative to title height)
                        doc.text(item.quantity?.toString() || '0',
                            columns.quantity.x,
                            rowY,
                            { width: columns.quantity.width, align: 'center' }
                        );

                        // Price
                        doc.text(`$${(item.product.price || 0).toFixed(2)}`,
                            columns.price.x,
                            rowY,
                            { width: columns.price.width, align: 'right' }
                        );

                        // Total
                        doc.text(`$${((item.product.price || 0) * (item.quantity || 0)).toFixed(2)}`,
                            columns.total.x,
                            rowY,
                            { width: columns.total.width, align: 'right' }
                        );

                        // Move to position after the content
                        doc.y = rowY + Math.max(titleHeight, 20); // Use at least 20 points height
                        doc.moveDown(1);  // Add consistent spacing

                        // Draw line between items
                        doc.moveTo(50, doc.y)
                           .lineTo(550, doc.y)
                           .stroke();
                        doc.moveDown(1);
                    }
                });
            }

            doc.moveDown(2);  // More space before total section

            // Add the total with a thicker line above
            doc.lineWidth(2)
               .moveTo(350, doc.y)
               .lineTo(550, doc.y)
               .stroke()
               .moveDown(1);  // More space after total line

            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text(`Total Amount: $${(order.totalPrice || 0).toFixed(2)}`, 
                    { align: 'right' });

            // Add footer with more spacing
            doc.moveDown(3);  // More space before footer
            doc.fontSize(10)
               .font('Helvetica')
               .fillColor('#666666')
               .text('Thank you for your business!', { align: 'center' })
               .moveDown(1)  // More space between footer lines
               .text('For any questions, please contact support@shop.com', { align: 'center' });

            // Finalize the PDF
            doc.end();

            // Handle events
            writeStream.on('finish', resolve);
        } catch (err) {
            console.error('Error generating invoice:', err);
            reject(err);
        }
    });
}

module.exports = generateInvoice; 