const PDFDocument = require('pdfkit')

class PDFInvoiceService {
  static generateInvoice(order) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 })
        const buffers = []
        
        // Collect PDF data
        doc.on('data', buffers.push.bind(buffers))
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers)
          resolve(pdfData)
        })
        
        // Header
        this.generateHeader(doc, order)
        
        // Invoice details
        this.generateInvoiceDetails(doc, order)
        
        // Customer information
        this.generateCustomerInformation(doc, order)
        
        // Invoice table
        this.generateInvoiceTable(doc, order)
        
        // Footer
        this.generateFooter(doc)
        
        doc.end()
        
      } catch (error) {
        reject(error)
      }
    })
  }
  
  static generateHeader(doc, order) {
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('Shoporia', 50, 45)
      .fontSize(10)
      .text('Modern E-commerce Platform', 50, 70)
      .text('support@shoporia.com', 50, 85)
      .text('https://shoporia.com', 50, 100)
      .moveDown()
    
    // Invoice title
    doc
      .fillColor('#444444')
      .fontSize(20)
      .text('INVOICE', 400, 45, { align: 'right' })
      .fontSize(10)
      .text(`Invoice #: INV-${order.orderNumber}`, 400, 70, { align: 'right' })
      .text(`Order #: ${order.orderNumber}`, 400, 85, { align: 'right' })
      .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 100, { align: 'right' })
      .text(`Status: ${order.status.toUpperCase()}`, 400, 115, { align: 'right' })
      .moveDown()
  }
  
  static generateInvoiceDetails(doc, order) {
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    doc
      .fillColor('#444444')
      .fontSize(12)
      .text('Invoice Details:', 50, 160)
      .fontSize(10)
      .text(`Invoice Number: INV-${order.orderNumber}`, 50, 180)
      .text(`Order Number: ${order.orderNumber}`, 50, 195)
      .text(`Invoice Date: ${invoiceDate}`, 50, 210)
      .text(`Payment Method: ${order.payment.method.replace('_', ' ').toUpperCase()}`, 50, 225)
      .text(`Payment Status: ${order.payment.status.toUpperCase()}`, 50, 240)
  }
  
  static generateCustomerInformation(doc, order) {
    doc
      .fillColor('#444444')
      .fontSize(12)
      .text('Bill To:', 300, 160)
      .fontSize(10)
      .text(order.user.displayName || 'N/A', 300, 180)
      .text(order.user.email || 'N/A', 300, 195)
      .text(order.user.phoneNumber ? `Phone: ${order.user.phoneNumber}` : 'Phone: N/A', 300, 210)
      .text(`Customer ID: ${order.user.customerId || 'N/A'}`, 300, 225)
    
    // Shipping address
    doc
      .fontSize(12)
      .text('Ship To:', 300, 260)
      .fontSize(10)
      .text(order.shippingAddress?.street || 'N/A', 300, 280)
      .text(`${order.shippingAddress?.city || 'N/A'}, ${order.shippingAddress?.state || 'N/A'} ${order.shippingAddress?.zipCode || 'N/A'}`, 300, 295)
      .text(order.shippingAddress?.country || 'N/A', 300, 310)
  }
  
  static generateInvoiceTable(doc, order) {
    let i
    const invoiceTableTop = 350
    
    doc.font('Helvetica-Bold')
    this.generateTableRow(
      doc,
      invoiceTableTop,
      'Item',
      'SKU',
      'Qty',
      'Unit Price',
      'Total'
    )
    this.generateHr(doc, invoiceTableTop + 20)
    doc.font('Helvetica')
    
    let position = invoiceTableTop + 30
    
    for (i = 0; i < order.items.length; i++) {
      const item = order.items[i]
      this.generateTableRow(
        doc,
        position,
        item.name || 'Product',
        item.sku || 'N/A',
        item.quantity.toString(),
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.quantity).toFixed(2)}`
      )
      
      position += 30
    }
    
    this.generateHr(doc, position)
    position += 20
    
    // Subtotal
    this.generateTableRow(
      doc,
      position,
      '',
      '',
      '',
      'Subtotal:',
      `$${order.subtotal.toFixed(2)}`
    )
    position += 20
    
    // Tax
    this.generateTableRow(
      doc,
      position,
      '',
      '',
      '',
      'Tax:',
      `$${order.tax.toFixed(2)}`
    )
    position += 20
    
    // Shipping
    const shippingCost = order.shipping || order.shippingCost || 0
    this.generateTableRow(
      doc,
      position,
      '',
      '',
      '',
      'Shipping:',
      shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`
    )
    position += 20
    
    // Discount (if any)
    if (order.discount && order.discount > 0) {
      this.generateTableRow(
        doc,
        position,
        '',
        '',
        '',
        'Discount:',
        `-$${order.discount.toFixed(2)}`
      )
      position += 20
    }
    
    // Total
    doc.font('Helvetica-Bold')
    this.generateTableRow(
      doc,
      position,
      '',
      '',
      '',
      'Total:',
      `$${order.total.toFixed(2)}`
    )
    doc.font('Helvetica')
  }
  
  static generateTableRow(doc, y, item, sku, qty, unitCost, lineTotal) {
    doc
      .fontSize(10)
      .text(item, 50, y, { width: 150, align: 'left' })
      .text(sku, 200, y, { width: 80, align: 'left' })
      .text(qty, 280, y, { width: 40, align: 'center' })
      .text(unitCost, 320, y, { width: 80, align: 'right' })
      .text(lineTotal, 400, y, { width: 100, align: 'right' })
  }
  
  static generateHr(doc, y) {
    doc
      .strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(500, y)
      .stroke()
  }
  
  static generateFooter(doc) {
    const bottomY = doc.page.height - 100
    
    doc
      .fontSize(10)
      .text('Thank you for your business!', 50, bottomY)
      .text('For questions about this invoice, please contact our customer service.', 50, bottomY + 15)
      .text(`Generated on: ${new Date().toLocaleString('en-US')}`, 50, bottomY + 30)
      .text('Shoporia - Your Modern E-commerce Platform', 50, bottomY + 50, { align: 'center' })
  }
}

module.exports = PDFInvoiceService