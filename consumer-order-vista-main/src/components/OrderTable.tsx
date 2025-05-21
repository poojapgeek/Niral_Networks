
import React, { useState } from "react";
import { SaleOrder, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { toast } from "@/hooks/use-toast";

interface OrderTableProps {
  orders: SaleOrder[];
  status: OrderStatus;
  onEditOrder: (order: SaleOrder) => void;
  onViewOrder: (order: SaleOrder) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  status,
  onEditOrder,
  onViewOrder,
}) => {
  const queryClient = useQueryClient();

  const markAsPaidMutation = useMutation({
    mutationFn: (orderId: number) => api.markOrderAsPaid(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast({
        title: "Order marked as paid",
        description: "The order has been successfully marked as paid.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark order as paid",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleMarkAsPaid = (orderId: number) => {
    markAsPaidMutation.mutate(orderId);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-accent">
            <TableHead className="font-medium">ID</TableHead>
            <TableHead className="font-medium">Customer Name</TableHead>
            <TableHead className="font-medium">Price (₹)</TableHead>
            <TableHead className="font-medium">Last Modified</TableHead>
            <TableHead className="text-right font-medium">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ 
                        backgroundColor: `rgb(${order.customer_id % 255}, ${(order.customer_id * 2) % 255}, ${(order.customer_id * 3) % 255})` 
                      }}
                    >
                      {order.customer_name.charAt(0)}
                    </div>
                    <span>{order.customer_name}</span>
                    <span className="text-muted-foreground text-xs">#{order.customer_id}</span>
                  </div>
                </TableCell>
                <TableCell>₹{order.total_price}</TableCell>
                <TableCell>
                  {format(new Date(order.last_modified), "dd/MM/yyyy (HH:mm)")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {status === "active" ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onEditOrder(order)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleMarkAsPaid(order.id)}
                        >
                          Mark as Paid
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onEditOrder(order)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onViewOrder(order)}
                        >
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => onViewOrder(order)}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
