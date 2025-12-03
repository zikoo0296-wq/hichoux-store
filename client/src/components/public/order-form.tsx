import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShoppingBag, Truck, CreditCard, CheckCircle } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { useState } from "react";

const orderFormSchema = z.object({
  customerName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z.string().min(8, "Le numéro de téléphone est invalide"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville est requise"),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  product: Product;
  quantity: number;
}

export function OrderForm({ product, quantity }: OrderFormProps) {
  const { toast } = useToast();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customerName: "",
      phone: "",
      address: "",
      city: "",
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const response = await apiRequest("POST", "/api/orders", {
        ...data,
        items: [{ productId: product.id, quantity }],
      });
      return response.json();
    },
    onSuccess: (data) => {
      setOrderSuccess(true);
      setOrderId(data.id);
      toast({
        title: "Commande confirmée!",
        description: `Votre commande #${data.id} a été enregistrée avec succès.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la commande.",
        variant: "destructive",
      });
    },
  });

  const price = parseFloat(product.price);
  const total = price * quantity;

  const generateWhatsAppMessage = () => {
    const values = form.getValues();
    const message = `Bonjour! Je souhaite commander:
    
Produit: ${product.title}
Quantité: ${quantity}
Prix total: ${total.toFixed(2)} DH

Mes informations:
Nom: ${values.customerName || "(à renseigner)"}
Téléphone: ${values.phone || "(à renseigner)"}
Adresse: ${values.address || "(à renseigner)"}
Ville: ${values.city || "(à renseigner)"}
${values.notes ? `Notes: ${values.notes}` : ""}`;

    return encodeURIComponent(message);
  };

  if (orderSuccess) {
    return (
      <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Commande confirmée!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                Votre commande #{orderId} a été enregistrée avec succès.
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Nous vous contacterons bientôt pour confirmer la livraison.</p>
              <p className="font-medium">Paiement à la livraison: {total.toFixed(2)} DH</p>
            </div>
            <Button variant="outline" onClick={() => window.location.href = "/products"}>
              Continuer vos achats
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Commander ce produit
        </CardTitle>
        <CardDescription>
          Remplissez vos informations pour passer commande. Paiement à la livraison.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{product.title}</span>
            <span>{price.toFixed(2)} DH</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Quantité</span>
            <span>x{quantity}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span className="text-primary">{total.toFixed(2)} DH</span>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createOrderMutation.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Votre nom complet" 
                      {...field}
                      data-testid="input-customer-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone *</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel"
                      placeholder="06 XX XX XX XX" 
                      {...field}
                      data-testid="input-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse de livraison *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Votre adresse complète" 
                      {...field}
                      data-testid="input-address"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ville *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Votre ville" 
                      {...field}
                      data-testid="input-city"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes de livraison (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Instructions spéciales pour la livraison..." 
                      className="resize-none"
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-3 pt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Truck className="h-4 w-4" />
                <span>Livraison rapide</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                <span>Paiement à la livraison</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={createOrderMutation.isPending}
                data-testid="button-submit-order"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Confirmer la commande
                  </>
                )}
              </Button>

              <a
                href={`https://wa.me/212600000000?text=${generateWhatsAppMessage()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full gap-2"
                  data-testid="button-whatsapp-order"
                >
                  <SiWhatsapp className="h-4 w-4" />
                  Commander via WhatsApp
                </Button>
              </a>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
