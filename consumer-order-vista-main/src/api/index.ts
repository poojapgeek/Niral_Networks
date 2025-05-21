
import { 
  Customer, 
  OrderStatus, 
  Product, 
  SaleOrder, 
  SaleOrderFormData, 
  User 
} from "../types";
import { 
  mockCustomers, 
  mockProducts, 
  mockSaleOrders, 
  mockUsers 
} from "../mockData";

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  login: async (username: string, password: string): Promise<User> => {
    await delay(500); // Simulate network delay
    
    const user = mockUsers.find(
      (user) => user.username === username && user.password === password
    );
    
    if (!user) {
      throw new Error("Invalid credentials");
    }
    
    return user;
  },
  
  getCustomers: async (): Promise<Customer[]> => {
    await delay(500);
    return [...mockCustomers];
  },
  
  getProducts: async (): Promise<Product[]> => {
    await delay(500);
    return [...mockProducts];
  },
  
  getSaleOrders: async (status: OrderStatus): Promise<SaleOrder[]> => {
    await delay(500);
    return mockSaleOrders
      .filter((order) => status === "completed" ? order.paid : !order.paid)
      .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime());
  },
  
  createSaleOrder: async (orderData: SaleOrderFormData): Promise<SaleOrder> => {
    await delay(500);
    
    const customer = mockCustomers.find(c => c.customer_profile.id === orderData.customer_id);
    
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    const newOrder: SaleOrder = {
      id: Math.max(0, ...mockSaleOrders.map(order => order.id)) + 1,
      customer_id: orderData.customer_id,
      customer_name: customer.customer_profile.name,
      items: orderData.items.map(item => {
        const product = mockProducts.find(p => 
          p.sku.some(sku => sku.id === item.sku_id)
        );
        
        return {
          ...item,
          product_name: product?.name || "Unknown Product"
        };
      }),
      paid: orderData.paid,
      invoice_no: orderData.invoice_no,
      invoice_date: orderData.invoice_date,
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      total_price: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    mockSaleOrders.push(newOrder);
    
    // Update inventory (in a real application this would be done on the server)
    orderData.items.forEach(item => {
      const productIndex = mockProducts.findIndex(p => 
        p.sku.some(sku => sku.id === item.sku_id)
      );
      
      if (productIndex !== -1) {
        const skuIndex = mockProducts[productIndex].sku.findIndex(sku => sku.id === item.sku_id);
        
        if (skuIndex !== -1) {
          mockProducts[productIndex].sku[skuIndex].quantity_in_inventory -= item.quantity;
        }
      }
    });
    
    return newOrder;
  },
  
  updateSaleOrder: async (id: number, orderData: SaleOrderFormData): Promise<SaleOrder> => {
    await delay(500);
    
    const orderIndex = mockSaleOrders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      throw new Error("Order not found");
    }
    
    const customer = mockCustomers.find(c => c.customer_profile.id === orderData.customer_id);
    
    if (!customer) {
      throw new Error("Customer not found");
    }
    
    // Update order
    const updatedOrder: SaleOrder = {
      ...mockSaleOrders[orderIndex],
      customer_id: orderData.customer_id,
      customer_name: customer.customer_profile.name,
      items: orderData.items.map(item => {
        const product = mockProducts.find(p => 
          p.sku.some(sku => sku.id === item.sku_id)
        );
        
        return {
          ...item,
          product_name: product?.name || "Unknown Product"
        };
      }),
      paid: orderData.paid,
      invoice_no: orderData.invoice_no,
      invoice_date: orderData.invoice_date,
      last_modified: new Date().toISOString(),
      total_price: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    mockSaleOrders[orderIndex] = updatedOrder;
    
    return updatedOrder;
  },
  
  markOrderAsPaid: async (id: number): Promise<SaleOrder> => {
    await delay(500);
    
    const orderIndex = mockSaleOrders.findIndex(order => order.id === id);
    
    if (orderIndex === -1) {
      throw new Error("Order not found");
    }
    
    // Update order
    mockSaleOrders[orderIndex] = {
      ...mockSaleOrders[orderIndex],
      paid: true,
      last_modified: new Date().toISOString()
    };
    
    return mockSaleOrders[orderIndex];
  }
};
