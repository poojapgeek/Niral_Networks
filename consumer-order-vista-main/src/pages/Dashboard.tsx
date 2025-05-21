import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { OrderStatus, SaleOrder, SaleOrderFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { OrderTable } from "@/components/OrderTable";
import { OrderForm } from "@/components/OrderForm";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Dashboard: React.FC = () => {
  const [status, setStatus] = useState<OrderStatus>("active");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch customers, products, orders with useQuery
  const {
    data: customers,
    isLoading: isLoadingCustomers,
    error: customersError,
  } = useQuery({
    queryKey: ["customers"],
    queryFn: api.getCustomers,
  });
  
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: api.getProducts,
  });
  
  const {
    data: orders,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useQuery({
    queryKey: ["orders", status],
    queryFn: () => api.getSaleOrders(status),
  });
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (data: SaleOrderFormData) => api.createSaleOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setCreateModalOpen(false);
      toast({
        title: "Order created",
        description: "Your order has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create order",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SaleOrderFormData }) =>
      api.updateSaleOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setEditModalOpen(false);
      setSelectedOrder(null);
      toast({
        title: "Order updated",
        description: "Your order has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update order",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Type-safe handler functions
  const handleCreateOrder = (data: any) => {
    // Ensure all required properties are present before submitting
    const formData: SaleOrderFormData = {
      customer_id: data.customer_id,
      items: data.items || [],
      paid: data.paid || false,
      invoice_no: data.invoice_no,
      invoice_date: data.invoice_date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    };
    createOrderMutation.mutate(formData);
  };
  
  const handleUpdateOrder = (data: any) => {
    if (selectedOrder) {
      // Ensure all required properties are present before submitting
      const formData: SaleOrderFormData = {
        customer_id: data.customer_id,
        items: data.items || [],
        paid: data.paid || false,
        invoice_no: data.invoice_no,
        invoice_date: data.invoice_date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
      };
      updateOrderMutation.mutate({ id: selectedOrder.id, data: formData });
    }
  };
  
  const handleEditOrder = (order: SaleOrder) => {
    setSelectedOrder(order);
    setEditModalOpen(true);
  };
  
  const handleViewOrder = (order: SaleOrder) => {
    setSelectedOrder(order);
    setViewModalOpen(true);
  };
  
  const isLoading = isLoadingCustomers || isLoadingProducts || isLoadingOrders;
  const error = customersError || productsError || ordersError;
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-lg text-destructive">
            Error loading data. Please try again.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sale Orders</h1>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Sale Order
          </Button>
        </div>

        <Tabs
          defaultValue="active"
          value={status}
          onValueChange={(value) => setStatus(value as OrderStatus)}
        >
          <TabsList>
            <TabsTrigger value="active">Active Sale Orders</TabsTrigger>
            <TabsTrigger value="completed">Completed Sale Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <OrderTable
              orders={orders || []}
              status="active"
              onEditOrder={handleEditOrder}
              onViewOrder={handleViewOrder}
            />
          </TabsContent>
          <TabsContent value="completed">
            <OrderTable
              orders={orders || []}
              status="completed"
              onEditOrder={handleEditOrder}
              onViewOrder={handleViewOrder}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Order Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sale Order</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new sale order
            </DialogDescription>
          </DialogHeader>
          <OrderForm
            customers={customers || []}
            products={products || []}
            onSubmit={handleCreateOrder}
            isSubmitting={createOrderMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Order Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sale Order</DialogTitle>
            <DialogDescription>
              Update the details of this sale order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <OrderForm
              initialData={selectedOrder}
              customers={customers || []}
              products={products || []}
              onSubmit={handleUpdateOrder}
              isSubmitting={updateOrderMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Order Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View Sale Order</DialogTitle>
            <DialogDescription>
              Order details (read-only)
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <OrderForm
              initialData={selectedOrder}
              customers={customers || []}
              products={products || []}
              onSubmit={() => {}}
              isSubmitting={false}
              readOnly={true}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Dashboard;
