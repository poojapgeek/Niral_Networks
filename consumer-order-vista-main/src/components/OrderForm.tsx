
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Customer, Product, SaleOrder } from "@/types";
import { Separator } from "@/components/ui/separator";

const orderFormSchema = z.object({
  customer_id: z.number({
    required_error: "Please select a customer",
  }),
  invoice_no: z.string().min(1, "Invoice number is required"),
  invoice_date: z.date({
    required_error: "Invoice date is required",
  }),
  items: z
    .array(
      z.object({
        sku_id: z.number({
          required_error: "Please select a product",
        }),
        price: z.number().min(0, "Price must be a positive number"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one item is required"),
  paid: z.boolean().default(false),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  initialData?: SaleOrder;
  customers: Customer[];
  products: Product[];
  onSubmit: (data: OrderFormValues) => void;
  isSubmitting: boolean;
  readOnly?: boolean;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  customers,
  products,
  onSubmit,
  isSubmitting,
  readOnly = false,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: initialData
      ? {
          customer_id: initialData.customer_id,
          invoice_no: initialData.invoice_no,
          invoice_date: new Date(initialData.invoice_date),
          items: initialData.items.map((item) => ({
            sku_id: item.sku_id,
            price: item.price,
            quantity: item.quantity,
          })),
          paid: initialData.paid,
        }
      : {
          customer_id: customers[0]?.customer_profile.id || 0,
          invoice_no: `INV-${format(new Date(), "yyyyMMdd")}-${Math.floor(
            Math.random() * 1000
          )
            .toString()
            .padStart(3, "0")}`,
          invoice_date: new Date(),
          items: [],
          paid: false,
        },
  });

  const { fields, append, remove } = useFieldArray({
    name: "items",
    control: form.control,
  });

  // Get all available SKUs for the selected product
  const getProductSKUs = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    return product ? product.sku : [];
  };

  const handleProductChange = (productId: number) => {
    setSelectedProduct(productId);
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    
    const product = products.find((p) => p.id === selectedProduct);
    if (!product || product.sku.length === 0) return;
    
    const sku = product.sku[0];
    
    append({
      sku_id: sku.id,
      price: sku.selling_price,
      quantity: 1,
    });
    
    setSelectedProduct(null);
  };

  const getProductNameBySKUId = (skuId: number) => {
    for (const product of products) {
      const sku = product.sku.find((s) => s.id === skuId);
      if (sku) return product.name;
    }
    return "Unknown Product";
  };

  const getSKUDetails = (skuId: number) => {
    for (const product of products) {
      const sku = product.sku.find((s) => s.id === skuId);
      if (sku) {
        return {
          productName: product.name,
          sku: sku,
        };
      }
    }
    return null;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Selection */}
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select
                  disabled={readOnly}
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={String(field.value)}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.customer_profile.id}
                        value={String(customer.customer_profile.id)}
                      >
                        {customer.customer_profile.name} - {customer.customer_profile.location_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Invoice Number */}
          <FormField
            control={form.control}
            name="invoice_no"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter invoice number" 
                    {...field} 
                    disabled={readOnly}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Invoice Date */}
          <FormField
            control={form.control}
            name="invoice_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Invoice Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild disabled={readOnly}>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "dd/MM/yyyy")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      className="pointer-events-auto"
                      disabled={readOnly}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Paid Status */}
          <FormField
            control={form.control}
            name="paid"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 mt-8">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={readOnly}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  Mark as paid/completed
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Order Items</h3>

          {!readOnly && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="col-span-3">
                <Select
                  value={selectedProduct ? String(selectedProduct) : ""}
                  onValueChange={(value) => handleProductChange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={String(product.id)}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedProduct}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">No items in this order yet.</p>
                {!readOnly && (
                  <p className="text-sm text-muted-foreground">
                    Use the product selector above to add items.
                  </p>
                )}
              </div>
            ) : (
              fields.map((field, index) => {
                const skuDetails = getSKUDetails(form.watch(`items.${index}.sku_id`));
                
                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center p-4 border rounded-md"
                  >
                    <div className="md:col-span-2">
                      <p className="font-medium">{getProductNameBySKUId(field.sku_id)}</p>
                      {skuDetails && (
                        <p className="text-sm text-muted-foreground">
                          {skuDetails.sku.amount} {skuDetails.sku.unit} - SKU #{field.sku_id}
                        </p>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (₹)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={readOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              disabled={readOnly}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!readOnly && (
                      <div className="flex justify-center md:justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="mt-6"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : initialData ? "Update Order" : "Create Order"}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};
