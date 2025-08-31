import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload, Edit3, Trash2, Plus, Save, X, ToggleLeft, ToggleRight, Image, MapPin, Settings, Tags, ShoppingBag, BarChart3, ChefHat } from "lucide-react";
import { AdminDeliveryZones } from "@/components/admin-delivery-zones";
import type { Product, Category, DeliveryZone, StoreSettings, Order, OrderItem, Ingredient } from "@shared/schema";

interface EditingProduct {
  id?: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  categoryId: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isPromotion: boolean;
  ingredients?: ProductIngredientConfig[];
}

interface ProductIngredientConfig {
  ingredientId: string;
  ingredientName?: string;
  isIncludedByDefault: boolean;
  quantity: number;
  customPrice?: string;
  isActive: boolean;
}

interface EditingDeliveryZone {
  id?: string;
  neighborhoodName: string;
  deliveryFee: string;
  isActive: boolean;
}

interface EditingIngredient {
  id?: string;
  name: string;
  category: string;
  price: string;
  discountPrice: string;
  isRemovable: boolean;
  isRequired: boolean;
  maxQuantity: number;
  isActive: boolean;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editingProduct, setEditingProduct] = useState<EditingProduct | null>(null);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [editingDeliveryZone, setEditingDeliveryZone] = useState<EditingDeliveryZone | null>(null);
  const [showNewZoneForm, setShowNewZoneForm] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<EditingIngredient | null>(null);
  const [showNewIngredientForm, setShowNewIngredientForm] = useState(false);
  const [activeTab, setActiveTab] = useState("products");

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria removida!",
        description: "Categoria foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      const message = error.message?.includes("existing products") 
        ? "Não é possível deletar categoria que possui produtos cadastrados."
        : "Erro ao remover categoria. Tente novamente.";
      toast({
        title: "Erro ao remover categoria",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Ingredient mutations
  const createIngredientMutation = useMutation({
    mutationFn: async (ingredientData: EditingIngredient) => {
      const data = {
        ...ingredientData,
        price: parseFloat(ingredientData.price) || 0,
        discountPrice: parseFloat(ingredientData.discountPrice) || 0,
      };
      return await apiRequest("POST", "/api/ingredients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setShowNewIngredientForm(false);
      toast({
        title: "Ingrediente criado!",
        description: "Novo ingrediente foi adicionado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar ingrediente",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  const updateIngredientMutation = useMutation({
    mutationFn: async (ingredientData: EditingIngredient) => {
      const data = {
        ...ingredientData,
        price: parseFloat(ingredientData.price) || 0,
        discountPrice: parseFloat(ingredientData.discountPrice) || 0,
      };
      return await apiRequest("PUT", `/api/ingredients/${ingredientData.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setEditingIngredient(null);
      toast({
        title: "Ingrediente atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar ingrediente",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: async (ingredientId: string) => {
      return await apiRequest("DELETE", `/api/ingredients/${ingredientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({
        title: "Ingrediente removido!",
        description: "Ingrediente foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover ingrediente",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", "admin"],
    queryFn: () => fetch("/api/products?admin=true").then(res => res.json()),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: deliveryZones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
  });

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["/api/store/settings"],
  });

  const updateProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("PUT", `/api/products/${productData.id}`, productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditingProduct(null);
      toast({
        title: "Produto atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest("POST", "/api/products", productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setShowNewProductForm(false);
      toast({
        title: "Produto criado!",
        description: "Novo produto adicionado ao cardápio.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      return await apiRequest("DELETE", `/api/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto removido!",
        description: "Produto foi removido do cardápio.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao remover produto",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = async (product: Product) => {
    // Load product ingredients
    let productIngredients: any[] = [];
    try {
      const response = await apiRequest("GET", `/api/products/${product.id}/ingredients`);
      productIngredients = await response.json();
    } catch (error) {
      console.error("Error loading product ingredients:", error);
    }

    // Transform ingredients to match our format
    const ingredients = productIngredients.map(pi => ({
      ingredientId: pi.ingredientId,
      ingredientName: pi.ingredient?.name || '',
      isIncludedByDefault: pi.isIncludedByDefault || false,
      quantity: pi.quantity || 1,
      customPrice: pi.ingredient?.price || "0.00",
      isActive: true,
    }));

    setEditingProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice || "",
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      isAvailable: product.isAvailable ?? true,
      isFeatured: product.isFeatured ?? false,
      isPromotion: product.isPromotion ?? false,
      ingredients: ingredients,
    });
  };

  const handleSave = () => {
    if (!editingProduct) return;

    const productData = {
      id: editingProduct.id,
      name: editingProduct.name,
      description: editingProduct.description,
      price: editingProduct.price,
      originalPrice: editingProduct.originalPrice || null,
      categoryId: editingProduct.categoryId,
      imageUrl: editingProduct.imageUrl,
      isAvailable: editingProduct.isAvailable,
      isFeatured: editingProduct.isFeatured,
      isPromotion: editingProduct.isPromotion,
      ingredients: editingProduct.ingredients || [],
    };

    updateProductMutation.mutate(productData);
  };

  const handleCreate = () => {
    if (!editingProduct) return;

    const productData = {
      name: editingProduct.name,
      description: editingProduct.description,
      price: editingProduct.price,
      originalPrice: editingProduct.originalPrice || null,
      categoryId: editingProduct.categoryId,
      imageUrl: editingProduct.imageUrl,
      isAvailable: editingProduct.isAvailable,
      isFeatured: editingProduct.isFeatured,
      isPromotion: editingProduct.isPromotion,
      ingredients: editingProduct.ingredients || [],
    };

    createProductMutation.mutate(productData);
  };

  const handleToggleAvailability = (product: Product) => {
    const productData = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      categoryId: product.categoryId,
      imageUrl: product.imageUrl,
      isAvailable: !product.isAvailable,
      isFeatured: product.isFeatured,
      isPromotion: product.isPromotion,
    };

    updateProductMutation.mutate(productData);
  };

  const handleDelete = (productId: string) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || "Categoria";
  };

  const startNewProduct = () => {
    setEditingProduct({
      name: "",
      description: "",
      price: "",
      originalPrice: "",
      categoryId: categories[0]?.id || "",
      imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
      isAvailable: true,
      isFeatured: false,
      isPromotion: false,
      ingredients: [],
    });
    setShowNewProductForm(true);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <Button
                    variant="ghost"
                    onClick={() => setLocation("/")}
                    className="mr-4 p-2"
                    data-testid="button-back-home"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-3xl font-bold text-foreground">🍔 Painel Administrativo</h1>
                </div>
                <p className="text-muted-foreground">Gerencie seus produtos sem mexer no código</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setLocation("/admin/analytics")}
                  variant="outline"
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                  data-testid="button-analytics"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
                <Button 
                  onClick={startNewProduct}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  data-testid="button-new-product"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="products" className="flex items-center">
              <Edit3 className="mr-2 h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="flex items-center">
              <Tags className="mr-2 h-4 w-4" />
              Ingredientes
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="banner" className="flex items-center">
              <Image className="mr-2 h-4 w-4" />
              Banner
            </TabsTrigger>
            <TabsTrigger value="store-info" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Loja
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Entrega
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* New Product Form */}
            {showNewProductForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plus className="mr-2 h-5 w-5" />
                    Adicionar Novo Produto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductForm
                    product={editingProduct}
                    setProduct={setEditingProduct}
                    categories={categories}
                    onSave={handleCreate}
                    onCancel={() => {
                      setShowNewProductForm(false);
                      setEditingProduct(null);
                    }}
                    isCreating={true}
                    isLoading={createProductMutation.isPending}
                  />
                </CardContent>
              </Card>
            )}

            {/* Products List */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Edit3 className="mr-2 h-5 w-5" />
              Gerenciar Produtos ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="border border-border rounded-lg p-4">
                  {editingProduct?.id === product.id ? (
                    <ProductForm
                      product={editingProduct}
                      setProduct={setEditingProduct}
                      categories={categories}
                      onSave={handleSave}
                      onCancel={() => setEditingProduct(null)}
                      isCreating={false}
                      isLoading={updateProductMutation.isPending}
                    />
                  ) : (
                    <div className="flex items-start space-x-4">
                      {/* Product Image */}
                      <div className="relative group">
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer rounded-lg flex items-center justify-center transition-opacity">
                          <Image className="text-white h-5 w-5" />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={() => handleToggleAvailability(product)}
                              variant={product.isAvailable ? "default" : "secondary"}
                              size="sm"
                              data-testid={`button-toggle-${product.id}`}
                            >
                              {product.isAvailable ? (
                                <>
                                  <ToggleRight className="mr-1 h-3 w-3" />
                                  Disponível
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="mr-1 h-3 w-3" />
                                  Indisponível
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => handleEdit(product)}
                              variant="outline"
                              size="sm"
                              data-testid={`button-edit-${product.id}`}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(product.id)}
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-${product.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-2">{product.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                              <span className="text-sm text-muted-foreground line-through">
                                R$ {parseFloat(product.originalPrice).toFixed(2)}
                              </span>
                            )}
                            <span className="text-xl font-bold text-accent">
                              R$ {parseFloat(product.price).toFixed(2)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {getCategoryName(product.categoryId)}
                            </Badge>
                            {product.isFeatured && (
                              <Badge className="bg-secondary text-secondary-foreground">
                                Destaque
                              </Badge>
                            )}
                            {product.isPromotion && (
                              <Badge className="bg-primary text-primary-foreground">
                                Promoção
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-6">
            {/* New Ingredient Form */}
            {showNewIngredientForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Novo Ingrediente</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewIngredientForm(false)}
                      data-testid="button-cancel-new-ingredient"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NewIngredientForm 
                    onSubmit={(data) => createIngredientMutation.mutate(data)}
                    isLoading={createIngredientMutation.isPending}
                  />
                </CardContent>
              </Card>
            )}

            {/* Ingredients List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Ingredientes e Adicionais</span>
                  <Button
                    onClick={() => setShowNewIngredientForm(true)}
                    data-testid="button-add-ingredient"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Ingrediente
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Group ingredients by category */}
                  {[
                    { key: 'protein', label: '🥩 Carnes' },
                    { key: 'cheese', label: '🧀 Queijos' },
                    { key: 'vegetable', label: '🥬 Vegetais' },
                    { key: 'sauce', label: '🍯 Molhos' },
                    { key: 'bread', label: '🍞 Pães' },
                    { key: 'extra', label: '✨ Extras' }
                  ].map(category => {
                    const categoryIngredients = ingredients.filter(ingredient => ingredient.category === category.key);
                    
                    if (categoryIngredients.length === 0) return null;
                    
                    return (
                      <div key={category.key} className="space-y-3">
                        <h3 className="text-lg font-semibold text-muted-foreground border-b pb-2">
                          {category.label}
                        </h3>
                        <div className="grid gap-3">
                          {categoryIngredients.map((ingredient) => (
                            <div
                              key={ingredient.id}
                              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                                !ingredient.isActive ? 'opacity-50 bg-muted/50' : 'hover:bg-muted/50'
                              }`}
                              data-testid={`ingredient-card-${ingredient.id}`}
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-semibold">{ingredient.name}</h4>
                                  <Badge variant={ingredient.isActive ? "default" : "secondary"}>
                                    {ingredient.isActive ? "Ativo" : "Inativo"}
                                  </Badge>
                                  {ingredient.isRequired && (
                                    <Badge variant="destructive">
                                      Obrigatório
                                    </Badge>
                                  )}
                                  {!ingredient.isRemovable && (
                                    <Badge variant="secondary">
                                      Não removível
                                    </Badge>
                                  )}
                                  {parseFloat(ingredient.price) > 0 && (
                                    <Badge variant="outline">
                                      +R$ {parseFloat(ingredient.price).toFixed(2)}
                                    </Badge>
                                  )}
                                  {parseFloat(ingredient.discountPrice) > 0 && (
                                    <Badge variant="outline" className="bg-green-100 text-green-800">
                                      -R$ {parseFloat(ingredient.discountPrice).toFixed(2)} se remover
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingIngredient({
                                    id: ingredient.id,
                                    name: ingredient.name,
                                    category: ingredient.category,
                                    price: ingredient.price.toString(),
                                    discountPrice: ingredient.discountPrice.toString(),
                                    isRemovable: ingredient.isRemovable,
                                    isRequired: ingredient.isRequired,
                                    maxQuantity: ingredient.maxQuantity,
                                    isActive: ingredient.isActive,
                                  })}
                                  data-testid={`button-edit-ingredient-${ingredient.id}`}
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteIngredientMutation.mutate(ingredient.id)}
                                  disabled={deleteIngredientMutation.isPending}
                                  data-testid={`button-delete-ingredient-${ingredient.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  {ingredients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Tags className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Nenhum ingrediente cadastrado.</p>
                      <p className="text-sm">Clique em "Adicionar Ingrediente" para começar.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Edit Ingredient Modal */}
            {editingIngredient && (
              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Editar Ingrediente</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingIngredient(null)}
                      data-testid="button-cancel-edit-ingredient"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditIngredientForm 
                    ingredient={editingIngredient}
                    onSubmit={(data) => updateIngredientMutation.mutate(data)}
                    isLoading={updateIngredientMutation.isPending}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="banner" className="space-y-6">
            <BannerManagement />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="store-info" className="space-y-6">
            <StoreInfoManagement />
          </TabsContent>

          <TabsContent value="delivery">
            <AdminDeliveryZones />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// New Ingredient Form Component
function NewIngredientForm({ onSubmit, isLoading }: { 
  onSubmit: (data: EditingIngredient) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<EditingIngredient>({
    name: "",
    category: "",
    price: "0",
    discountPrice: "0",
    isRemovable: true,
    isRequired: false,
    maxQuantity: 1,
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.category) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ingredient-name">Nome do Ingrediente</Label>
          <Input
            id="ingredient-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Bacon extra, Queijo cheddar..."
            data-testid="input-ingredient-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ingredient-category">Categoria</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger data-testid="select-ingredient-category">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="protein">🥩 Carnes</SelectItem>
              <SelectItem value="cheese">🧀 Queijos</SelectItem>
              <SelectItem value="vegetable">🥬 Vegetais</SelectItem>
              <SelectItem value="sauce">🍯 Molhos</SelectItem>
              <SelectItem value="bread">🍞 Pães</SelectItem>
              <SelectItem value="extra">✨ Extras</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ingredient-price">Preço Adicional (R$)</Label>
          <Input
            id="ingredient-price"
            type="text"
            inputMode="decimal"
            value={formData.price}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, numbers and decimal point
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setFormData({ ...formData, price: value });
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                setFormData({ ...formData, price: parseFloat(value).toFixed(2) });
              } else {
                setFormData({ ...formData, price: '0.00' });
              }
            }}
            placeholder="0.00"
            data-testid="input-ingredient-price"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ingredient-discount">Desconto se Remover (R$)</Label>
          <Input
            id="ingredient-discount"
            type="text"
            inputMode="decimal"
            value={formData.discountPrice}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, numbers and decimal point
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setFormData({ ...formData, discountPrice: value });
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                setFormData({ ...formData, discountPrice: parseFloat(value).toFixed(2) });
              } else {
                setFormData({ ...formData, discountPrice: '0.00' });
              }
            }}
            placeholder="0.00"
            data-testid="input-ingredient-discount"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ingredient-max-qty">Quantidade Máxima</Label>
          <Input
            id="ingredient-max-qty"
            type="number"
            min="1"
            max="10"
            value={formData.maxQuantity}
            onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) || 1 })}
            data-testid="input-ingredient-max-qty"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="ingredient-removable"
            checked={formData.isRemovable}
            onCheckedChange={(checked) => setFormData({ ...formData, isRemovable: checked })}
            data-testid="switch-ingredient-removable"
          />
          <Label htmlFor="ingredient-removable">Removível</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="ingredient-required"
            checked={formData.isRequired}
            onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
            data-testid="switch-ingredient-required"
          />
          <Label htmlFor="ingredient-required">Obrigatório</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="ingredient-active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="switch-ingredient-active"
          />
          <Label htmlFor="ingredient-active">Ativo</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading || !formData.name.trim() || !formData.category}
          data-testid="button-save-ingredient"
        >
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Salvando..." : "Salvar Ingrediente"}
        </Button>
      </div>
    </form>
  );
}

// Edit Ingredient Form Component
function EditIngredientForm({ 
  ingredient, 
  onSubmit, 
  isLoading 
}: { 
  ingredient: EditingIngredient;
  onSubmit: (data: EditingIngredient) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<EditingIngredient>(ingredient);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.category) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-ingredient-name">Nome do Ingrediente</Label>
          <Input
            id="edit-ingredient-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Bacon extra, Queijo cheddar..."
            data-testid="input-edit-ingredient-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-ingredient-category">Categoria</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger data-testid="select-edit-ingredient-category">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="protein">🥩 Carnes</SelectItem>
              <SelectItem value="cheese">🧀 Queijos</SelectItem>
              <SelectItem value="vegetable">🥬 Vegetais</SelectItem>
              <SelectItem value="sauce">🍯 Molhos</SelectItem>
              <SelectItem value="bread">🍞 Pães</SelectItem>
              <SelectItem value="extra">✨ Extras</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-ingredient-price">Preço Adicional (R$)</Label>
          <Input
            id="edit-ingredient-price"
            type="text"
            inputMode="decimal"
            value={formData.price}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, numbers and decimal point
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setFormData({ ...formData, price: value });
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                setFormData({ ...formData, price: parseFloat(value).toFixed(2) });
              } else {
                setFormData({ ...formData, price: '0.00' });
              }
            }}
            placeholder="0.00"
            data-testid="input-edit-ingredient-price"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-ingredient-discount">Desconto se Remover (R$)</Label>
          <Input
            id="edit-ingredient-discount"
            type="text"
            inputMode="decimal"
            value={formData.discountPrice}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, numbers and decimal point
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setFormData({ ...formData, discountPrice: value });
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                setFormData({ ...formData, discountPrice: parseFloat(value).toFixed(2) });
              } else {
                setFormData({ ...formData, discountPrice: '0.00' });
              }
            }}
            placeholder="0.00"
            data-testid="input-edit-ingredient-discount"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-ingredient-max-qty">Quantidade Máxima</Label>
          <Input
            id="edit-ingredient-max-qty"
            type="number"
            min="1"
            max="10"
            value={formData.maxQuantity}
            onChange={(e) => setFormData({ ...formData, maxQuantity: parseInt(e.target.value) || 1 })}
            data-testid="input-edit-ingredient-max-qty"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-ingredient-removable"
            checked={formData.isRemovable}
            onCheckedChange={(checked) => setFormData({ ...formData, isRemovable: checked })}
            data-testid="switch-edit-ingredient-removable"
          />
          <Label htmlFor="edit-ingredient-removable">Removível</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-ingredient-required"
            checked={formData.isRequired}
            onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
            data-testid="switch-edit-ingredient-required"
          />
          <Label htmlFor="edit-ingredient-required">Obrigatório</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-ingredient-active"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="switch-edit-ingredient-active"
          />
          <Label htmlFor="edit-ingredient-active">Ativo</Label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading || !formData.name.trim() || !formData.category}
          data-testid="button-update-ingredient"
        >
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Salvando..." : "Atualizar Ingrediente"}
        </Button>
      </div>
    </form>
  );
}

interface ProductFormProps {
  product: EditingProduct | null;
  setProduct: (product: EditingProduct) => void;
  categories: Category[];
  onSave: () => void;
  onCancel: () => void;
  isCreating: boolean;
  isLoading: boolean;
}

interface NewCategoryForm {
  name: string;
  slug: string;
  icon: string;
  displayOrder: number;
}

function ProductForm({ product, setProduct, categories, onSave, onCancel, isCreating, isLoading }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState<NewCategoryForm>({
    name: "",
    slug: "",
    icon: "🍔",
    displayOrder: categories.length + 1
  });

  // Fetch ingredients
  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return await apiRequest("POST", "/api/categories", categoryData);
    },
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      const newCat = await response.json();
      setProduct({ ...product!, categoryId: newCat.id });
      setShowNewCategoryForm(false);
      setNewCategory({ name: "", slug: "", icon: "🍔", displayOrder: categories.length + 1 });
      toast({
        title: "Categoria criada!",
        description: "Nova categoria adicionada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar categoria",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome da categoria.",
        variant: "destructive",
      });
      return;
    }

    if (!newCategory.slug.trim()) {
      setNewCategory(prev => ({
        ...prev,
        slug: prev.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }));
    }

    createCategoryMutation.mutate(newCategory);
  };

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria removida!",
        description: "Categoria foi removida com sucesso.",
      });
    },
    onError: (error: any) => {
      const message = error.message?.includes("existing products") 
        ? "Não é possível deletar categoria que possui produtos cadastrados."
        : "Erro ao remover categoria. Tente novamente.";
      toast({
        title: "Erro ao remover categoria",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (confirm(`Tem certeza que deseja remover a categoria "${categoryName}"?`)) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  if (!product) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input
            id="name"
            value={product.name}
            onChange={(e) => setProduct({ ...product, name: e.target.value })}
            placeholder="Ex: X-Bacon Deluxe"
            data-testid="input-product-name"
          />
        </div>
        <div>
          <Label htmlFor="category">Categoria *</Label>
          <div className="space-y-2">
            <Select
              value={product.categoryId}
              onValueChange={(value) => setProduct({ ...product, categoryId: value })}
            >
              <SelectTrigger data-testid="select-category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                className="w-full"
                data-testid="button-new-category"
              >
                <Plus className="mr-2 h-4 w-4" />
                {showNewCategoryForm ? 'Cancelar' : 'Criar Nova Categoria'}
              </Button>
              
              {categories.length > 0 && (
                <div className="text-sm">
                  <Label className="text-xs text-muted-foreground">Categorias existentes:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center bg-muted rounded px-2 py-1 text-xs"
                      >
                        <span className="mr-1">{category.icon}</span>
                        <span className="mr-2">{category.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="h-4 w-4 p-0 text-destructive hover:text-destructive"
                          data-testid={`button-delete-category-${category.slug}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {showNewCategoryForm && (
              <Card className="p-4 bg-muted/30">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="newCategoryName">Nome *</Label>
                      <Input
                        id="newCategoryName"
                        value={newCategory.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setNewCategory(prev => ({
                            ...prev,
                            name,
                            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
                          }));
                        }}
                        placeholder="Ex: Combos"
                        data-testid="input-new-category-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newCategoryIcon">Ícone *</Label>
                      <Input
                        id="newCategoryIcon"
                        value={newCategory.icon}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="🍔"
                        data-testid="input-new-category-icon"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={createCategoryMutation.isPending}
                      size="sm"
                      data-testid="button-save-category"
                    >
                      {createCategoryMutation.isPending ? 'Criando...' : 'Criar Categoria'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewCategoryForm(false);
                        setNewCategory({ name: "", slug: "", icon: "🍔", displayOrder: categories.length + 1 });
                      }}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Preço *</Label>
          <Input
            id="price"
            type="text"
            inputMode="decimal"
            value={product.price}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, numbers and decimal point
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setProduct({ ...product, price: value });
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                setProduct({ ...product, price: parseFloat(value).toFixed(2) });
              } else {
                setProduct({ ...product, price: '0.00' });
              }
            }}
            placeholder="18.90"
            data-testid="input-product-price"
          />
        </div>
        <div>
          <Label htmlFor="originalPrice">Preço Original (opcional)</Label>
          <Input
            id="originalPrice"
            type="text"
            inputMode="decimal"
            value={product.originalPrice}
            onChange={(e) => {
              const value = e.target.value;
              // Allow empty string, numbers and decimal point
              if (value === '' || /^\d*\.?\d*$/.test(value)) {
                setProduct({ ...product, originalPrice: value });
              }
            }}
            onBlur={(e) => {
              const value = e.target.value;
              if (value && !isNaN(parseFloat(value))) {
                setProduct({ ...product, originalPrice: parseFloat(value).toFixed(2) });
              } else {
                setProduct({ ...product, originalPrice: '' });
              }
            }}
            placeholder="22.90"
            data-testid="input-original-price"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          value={product.description}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
          placeholder="Hambúrguer suculento com bacon crocante, queijo e molho especial"
          rows={3}
          data-testid="input-product-description"
        />
      </div>

      <div>
        <Label htmlFor="imageUrl">URL da Imagem *</Label>
        <Input
          id="imageUrl"
          value={product.imageUrl}
          onChange={(e) => setProduct({ ...product, imageUrl: e.target.value })}
          placeholder="https://images.unsplash.com/photo-..."
          data-testid="input-image-url"
        />
      </div>

      <div className="flex items-center space-x-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={product.isAvailable}
            onChange={(e) => setProduct({ ...product, isAvailable: e.target.checked })}
            className="rounded"
            data-testid="checkbox-available"
          />
          <span>Disponível</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={product.isFeatured}
            onChange={(e) => setProduct({ ...product, isFeatured: e.target.checked })}
            className="rounded"
            data-testid="checkbox-featured"
          />
          <span>Produto em Destaque</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={product.isPromotion}
            onChange={(e) => setProduct({ ...product, isPromotion: e.target.checked })}
            className="rounded"
            data-testid="checkbox-promotion"
          />
          <span>Em Promoção</span>
        </label>
      </div>

      {/* Ingredients Section */}
      <ProductIngredientsSection 
        product={product}
        setProduct={setProduct}
        ingredients={ingredients}
        isCreating={isCreating}
      />

      <Separator />

      <div className="flex space-x-2">
        <Button
          onClick={onSave}
          disabled={isLoading || !product.name || !product.description || !product.price || !product.categoryId}
          className="bg-accent hover:bg-accent/90"
          data-testid="button-save-product"
        >
          <Save className="mr-1 h-4 w-4" />
          {isLoading ? "Salvando..." : (isCreating ? "Criar Produto" : "Salvar Alterações")}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          data-testid="button-cancel-edit"
        >
          <X className="mr-1 h-4 w-4" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// Banner Management Component
function BannerManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<StoreSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["/api/store/settings"],
  });

  // Inicializar formData quando os dados chegarem
  useEffect(() => {
    if (storeSettings && !hasChanges) {
      setFormData({
        bannerTitle: storeSettings.bannerTitle,
        bannerDescription: storeSettings.bannerDescription,
        bannerPrice: storeSettings.bannerPrice,
        bannerImageUrl: storeSettings.bannerImageUrl,
        bannerColor1: storeSettings.bannerColor1,
        bannerColor2: storeSettings.bannerColor2,
        bannerColor3: storeSettings.bannerColor3,
        bannerColor4: storeSettings.bannerColor4,
        bannerBackgroundImage: storeSettings.bannerBackgroundImage,
        bannerUseImageBackground: storeSettings.bannerUseImageBackground,
      });
    }
  }, [storeSettings, hasChanges]);

  const updateStoreSettingsMutation = useMutation({
    mutationFn: async (data: Partial<StoreSettings>) => {
      return await apiRequest("PUT", "/api/store/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/settings"] });
      setHasChanges(false);
      toast({
        title: "Banner atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar banner",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof StoreSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveBanner = () => {
    updateStoreSettingsMutation.mutate(formData);
  };

  if (!storeSettings) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Image className="mr-2 h-5 w-5" />
          Gerenciar Banner Principal
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure o banner que aparece no topo do site
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="banner-title">Título do Banner</Label>
            <Input
              id="banner-title"
              value={formData.bannerTitle || ""}
              onChange={(e) => handleInputChange('bannerTitle', e.target.value)}
              placeholder="Ex: Hambúrguers"
              data-testid="input-banner-title"
            />
          </div>
          <div>
            <Label htmlFor="banner-price">Preço</Label>
            <Input
              id="banner-price"
              value={formData.bannerPrice || ""}
              onChange={(e) => handleInputChange('bannerPrice', e.target.value)}
              placeholder="Ex: 18.90"
              data-testid="input-banner-price"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="banner-description">Descrição</Label>
          <Textarea
            id="banner-description"
            value={formData.bannerDescription || ""}
            onChange={(e) => handleInputChange('bannerDescription', e.target.value)}
            placeholder="Ex: Ingredientes frescos, sabor incomparável."
            rows={3}
            data-testid="textarea-banner-description"
          />
        </div>

        <div>
          <Label htmlFor="banner-image">URL da Imagem</Label>
          <Input
            id="banner-image"
            value={formData.bannerImageUrl || ""}
            onChange={(e) => handleInputChange('bannerImageUrl', e.target.value)}
            placeholder="https://exemplo.com/imagem-banner.jpg"
            data-testid="input-banner-image"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Cole aqui a URL de uma imagem (recomendado: 600x400px)
          </p>
        </div>

        {formData.bannerImageUrl && (
          <div>
            <Label>Preview da Imagem</Label>
            <div className="border rounded-lg p-4 bg-muted">
              <img
                src={formData.bannerImageUrl}
                alt="Preview banner"
                className="max-w-full h-48 object-cover rounded-lg mx-auto"
              />
            </div>
          </div>
        )}

        {/* Personalização Visual */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🎨 Aparência do Banner</h3>
          
          {/* Opção de usar imagem de fundo */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="use-image-background"
              checked={formData.bannerUseImageBackground || false}
              onChange={(e) => handleInputChange('bannerUseImageBackground', e.target.checked.toString())}
              className="rounded"
              data-testid="checkbox-use-image-background"
            />
            <Label htmlFor="use-image-background">Usar imagem de fundo (em vez de gradiente)</Label>
          </div>

          {/* URL da imagem de fundo */}
          {formData.bannerUseImageBackground && (
            <div>
              <Label htmlFor="banner-background-image">URL da Imagem de Fundo</Label>
              <Input
                id="banner-background-image"
                value={formData.bannerBackgroundImage || ""}
                onChange={(e) => handleInputChange('bannerBackgroundImage', e.target.value)}
                placeholder="https://exemplo.com/imagem-fundo.jpg"
                data-testid="input-banner-background-image"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Imagem que cobrirá todo o fundo do banner
              </p>
            </div>
          )}

          {/* Cores do gradiente */}
          {!formData.bannerUseImageBackground && (
            <div>
              <Label>Cores do Gradiente</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                <div>
                  <Label htmlFor="banner-color-1" className="text-sm">Cor 1</Label>
                  <Input
                    type="color"
                    id="banner-color-1"
                    value={formData.bannerColor1 || "#ff6b35"}
                    onChange={(e) => handleInputChange('bannerColor1', e.target.value)}
                    className="h-12 w-full"
                    data-testid="input-banner-color-1"
                  />
                </div>
                <div>
                  <Label htmlFor="banner-color-2" className="text-sm">Cor 2</Label>
                  <Input
                    type="color"
                    id="banner-color-2"
                    value={formData.bannerColor2 || "#f7931e"}
                    onChange={(e) => handleInputChange('bannerColor2', e.target.value)}
                    className="h-12 w-full"
                    data-testid="input-banner-color-2"
                  />
                </div>
                <div>
                  <Label htmlFor="banner-color-3" className="text-sm">Cor 3</Label>
                  <Input
                    type="color"
                    id="banner-color-3"
                    value={formData.bannerColor3 || "#ffd23f"}
                    onChange={(e) => handleInputChange('bannerColor3', e.target.value)}
                    className="h-12 w-full"
                    data-testid="input-banner-color-3"
                  />
                </div>
                <div>
                  <Label htmlFor="banner-color-4" className="text-sm">Cor 4</Label>
                  <Input
                    type="color"
                    id="banner-color-4"
                    value={formData.bannerColor4 || "#ff8c42"}
                    onChange={(e) => handleInputChange('bannerColor4', e.target.value)}
                    className="h-12 w-full"
                    data-testid="input-banner-color-4"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                O gradiente vai da Cor 1 → Cor 2 → Cor 3 → Cor 4
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                bannerTitle: storeSettings?.bannerTitle,
                bannerDescription: storeSettings?.bannerDescription,
                bannerPrice: storeSettings?.bannerPrice,
                bannerImageUrl: storeSettings?.bannerImageUrl,
                bannerColor1: storeSettings?.bannerColor1,
                bannerColor2: storeSettings?.bannerColor2,
                bannerColor3: storeSettings?.bannerColor3,
                bannerColor4: storeSettings?.bannerColor4,
                bannerBackgroundImage: storeSettings?.bannerBackgroundImage,
                bannerUseImageBackground: storeSettings?.bannerUseImageBackground,
              });
              setHasChanges(false);
            }}
            disabled={!hasChanges}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveBanner}
            disabled={updateStoreSettingsMutation.isPending || !hasChanges}
          >
            {updateStoreSettingsMutation.isPending ? "Salvando..." : "Salvar Banner"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Store Info Management Component
function StoreInfoManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<StoreSettings>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: storeSettings } = useQuery<StoreSettings>({
    queryKey: ["/api/store/settings"],
  });

  // Inicializar formData quando os dados chegarem
  useEffect(() => {
    if (storeSettings && !hasChanges) {
      setFormData({
        siteName: storeSettings.siteName,
        storeTitle: storeSettings.storeTitle,
        storeImageUrl: storeSettings.storeImageUrl,
        storeAddress: storeSettings.storeAddress,
        storeNeighborhood: storeSettings.storeNeighborhood,
        storeHours: storeSettings.storeHours,
        deliveryTime: storeSettings.deliveryTime,
        deliveryFeeRange: storeSettings.deliveryFeeRange,
        paymentMethods: storeSettings.paymentMethods,
      });
    }
  }, [storeSettings, hasChanges]);

  const updateStoreSettingsMutation = useMutation({
    mutationFn: async (data: Partial<StoreSettings>) => {
      return await apiRequest("PUT", "/api/store/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store/settings"] });
      setHasChanges(false);
      toast({
        title: "Informações atualizadas!",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar informações",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof StoreSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveInfo = () => {
    updateStoreSettingsMutation.mutate(formData);
  };

  if (!storeSettings) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Informações da Loja
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure as informações que aparecem na seção "Nossa Loja"
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nome do Site e Título da Loja */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Identidade da Marca</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="site-name">Nome do Site (Cabeçalho)</Label>
              <Input
                id="site-name"
                value={formData.siteName || ""}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                placeholder="Ex: Burger House"
                data-testid="input-site-name"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Nome que aparece no cabeçalho do site (🍔 Nome)
              </p>
            </div>
            <div>
              <Label htmlFor="store-title">Título da Seção Nossa Loja</Label>
              <Input
                id="store-title"
                value={formData.storeTitle || ""}
                onChange={(e) => handleInputChange('storeTitle', e.target.value)}
                placeholder="Ex: Nossa Loja"
                data-testid="input-store-title"
              />
            </div>
            <div>
              <Label htmlFor="store-image">URL da Imagem da Loja</Label>
              <Input
                id="store-image"
                value={formData.storeImageUrl || ""}
                onChange={(e) => handleInputChange('storeImageUrl', e.target.value)}
                placeholder="https://exemplo.com/imagem-loja.jpg"
                data-testid="input-store-image"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Foto do interior/exterior da hamburgueria
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Informações de Localização */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Localização</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="store-address">Endereço</Label>
              <Input
                id="store-address"
                value={formData.storeAddress || ""}
                onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                placeholder="Ex: Rua das Delícias, 123"
                data-testid="input-store-address"
              />
            </div>
            <div>
              <Label htmlFor="store-neighborhood">Bairro/Cidade</Label>
              <Input
                id="store-neighborhood"
                value={formData.storeNeighborhood || ""}
                onChange={(e) => handleInputChange('storeNeighborhood', e.target.value)}
                placeholder="Ex: Centro, São Paulo - SP"
                data-testid="input-store-neighborhood"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Horários e Funcionamento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Funcionamento</h3>
          <div>
            <Label htmlFor="store-hours">Horário de Funcionamento</Label>
            <Textarea
              id="store-hours"
              value={formData.storeHours || ""}
              onChange={(e) => handleInputChange('storeHours', e.target.value)}
              placeholder="Segunda a Sexta: 18h - 23h
Sábado e Domingo: 18h - 00h"
              rows={3}
              data-testid="textarea-store-hours"
            />
          </div>
        </div>

        <Separator />

        {/* Entrega e Pagamento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Entrega e Pagamento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery-time">Tempo de Entrega</Label>
              <Input
                id="delivery-time"
                value={formData.deliveryTime || ""}
                onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                placeholder="Ex: Tempo médio: 30-45 minutos"
                data-testid="input-delivery-time"
              />
            </div>
            <div>
              <Label htmlFor="delivery-fee-range">Faixa de Taxa de Entrega</Label>
              <Input
                id="delivery-fee-range"
                value={formData.deliveryFeeRange || ""}
                onChange={(e) => handleInputChange('deliveryFeeRange', e.target.value)}
                placeholder="Ex: Taxa: R$ 3,90 - R$ 8,90"
                data-testid="input-delivery-fee-range"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="payment-methods">Métodos de Pagamento</Label>
            <Textarea
              id="payment-methods"
              value={formData.paymentMethods || ""}
              onChange={(e) => handleInputChange('paymentMethods', e.target.value)}
              placeholder="Dinheiro, Cartão, PIX
Mercado Pago integrado"
              rows={3}
              data-testid="textarea-payment-methods"
            />
          </div>
        </div>

        {/* Preview da Imagem da Loja */}
        {formData.storeImageUrl && (
          <>
            <Separator />
            <div>
              <Label>Preview da Imagem da Loja</Label>
              <div className="border rounded-lg p-4 bg-muted">
                <img
                  src={formData.storeImageUrl}
                  alt="Preview loja"
                  className="max-w-full h-48 object-cover rounded-lg mx-auto"
                />
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                storeTitle: storeSettings?.storeTitle,
                storeImageUrl: storeSettings?.storeImageUrl,
                storeAddress: storeSettings?.storeAddress,
                storeNeighborhood: storeSettings?.storeNeighborhood,
                storeHours: storeSettings?.storeHours,
                deliveryTime: storeSettings?.deliveryTime,
                deliveryFeeRange: storeSettings?.deliveryFeeRange,
                paymentMethods: storeSettings?.paymentMethods,
              });
              setHasChanges(false);
            }}
            disabled={!hasChanges}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveInfo}
            disabled={updateStoreSettingsMutation.isPending || !hasChanges}
          >
            {updateStoreSettingsMutation.isPending ? "Salvando..." : "Salvar Informações"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Order Management Component
function OrderManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("todos");

  // Fetch orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status atualizado!",
        description: "O status do pedido foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateOrderPaymentStatusMutation = useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: string }) => {
      return await apiRequest("PUT", `/api/orders/${orderId}/payment-status`, { paymentStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status de pagamento atualizado!",
        description: "O status de pagamento foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar pagamento",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handlePaymentStatusUpdate = (orderId: string, paymentStatus: string) => {
    updateOrderPaymentStatusMutation.mutate({ orderId, paymentStatus });
  };

  const handleWhatsApp = (phone: string, orderNumber: string) => {
    const message = `Olá! Seu pedido #${orderNumber} foi atualizado. Entre em contato para mais informações.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Filter orders based on status
  const filteredOrders = orders.filter((order: Order) => 
    statusFilter === "todos" || order.orderStatus === statusFilter
  );

  // Calculate statistics
  const todayOrders = orders.filter((order: Order) => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });

  const preparingOrders = orders.filter((order: Order) => order.orderStatus === "preparando");
  // Only count revenue from paid orders
  const paidTodayOrders = todayOrders.filter((order: Order) => order.paymentStatus === "paid");
  const totalRevenue = paidTodayOrders.reduce((sum: number, order: Order) => sum + parseFloat(order.total), 0);

  const statusColors: Record<string, string> = {
    pendente: "bg-red-500",
    preparando: "bg-yellow-500", 
    entregando: "bg-blue-500",
    entregue: "bg-green-500"
  };

  const statusLabels: Record<string, string> = {
    pendente: "🔴 Pendente",
    preparando: "🟡 Preparando",
    entregando: "🔵 Saindo",
    entregue: "🟢 Entregue"
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">{todayOrders.length}</div>
            <div className="text-sm opacity-90">Pedidos Hoje</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">{preparingOrders.length}</div>
            <div className="text-sm opacity-90">Em Preparo</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
            <div className="text-sm opacity-90">Faturamento</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">45min</div>
            <div className="text-sm opacity-90">Tempo Médio</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "todos", label: "Todos" },
              { key: "pendente", label: "Pendentes" },
              { key: "preparando", label: "Em Preparo" },
              { key: "entregando", label: "Saindo" },
              { key: "entregue", label: "Entregues" }
            ].map(filter => (
              <Button
                key={filter.key}
                variant={statusFilter === filter.key ? "default" : "outline"}
                onClick={() => setStatusFilter(filter.key)}
                className="rounded-full"
                data-testid={`filter-${filter.key}`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {statusFilter === "todos" ? "Nenhum pedido encontrado." : `Nenhum pedido ${statusFilter} encontrado.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order: Order) => (
            <Card key={order.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">#{order.orderNumber} - {order.customerName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(order.createdAt).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="text-xl font-bold text-orange-600">
                    R$ {order.total}
                  </div>
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span className="text-sm">{order.customerPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span className="text-sm">{order.streetName}, {order.houseNumber} - {order.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>💳</span>
                    <span className="text-sm">{order.paymentMethod}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>⏱️</span>
                    <span className="text-sm">
                      {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60))} min atrás
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                {order.orderItems && order.orderItems.length > 0 && (
                  <div className="mb-4 p-4 bg-muted/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Itens do Pedido:</h4>
                    <div className="space-y-1">
                      {order.orderItems.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x Produto</span>
                          <span>R$ {item.totalPrice}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>R$ {order.total}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status and Actions */}
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusLabels).map(([status, label]) => (
                      <Button
                        key={status}
                        variant={order.orderStatus === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, status)}
                        className={`rounded-full ${order.orderStatus === status ? statusColors[status] + ' text-white' : ''}`}
                        disabled={updateOrderStatusMutation.isPending}
                        data-testid={`status-${status}-${order.orderNumber}`}
                      >
                        {label}
                      </Button>
                    ))}
                    
                    {/* Payment Status Button */}
                    <Button
                      variant={order.paymentStatus === "paid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePaymentStatusUpdate(order.id, order.paymentStatus === "paid" ? "pending" : "paid")}
                      className={`rounded-full ${order.paymentStatus === "paid" ? 'bg-green-600 text-white' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
                      disabled={updateOrderPaymentStatusMutation.isPending}
                      data-testid={`payment-${order.orderNumber}`}
                    >
                      {order.paymentStatus === "paid" ? "✅ Pago" : "💰 Marcar Pago"}
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWhatsApp(order.customerPhone, order.orderNumber)}
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      data-testid={`whatsapp-${order.orderNumber}`}
                    >
                      💬 WhatsApp
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Product Ingredients Management Component
interface ProductIngredientsSectionProps {
  product: EditingProduct;
  setProduct: (product: EditingProduct) => void;
  ingredients: Ingredient[];
  isCreating: boolean;
}

function ProductIngredientsSection({ product, setProduct, ingredients, isCreating }: ProductIngredientsSectionProps) {
  const { toast } = useToast();
  const [selectedIngredients, setSelectedIngredients] = useState<ProductIngredientConfig[]>(
    product.ingredients || []
  );

  // Atualizar o produto quando os ingredientes mudarem
  useEffect(() => {
    setProduct({ ...product, ingredients: selectedIngredients });
  }, [selectedIngredients]);

  const addIngredient = (ingredientId: string) => {
    const ingredient = ingredients.find(i => i.id === ingredientId);
    if (!ingredient) return;

    const newIngredientConfig: ProductIngredientConfig = {
      ingredientId,
      ingredientName: ingredient.name,
      isIncludedByDefault: true,
      quantity: 1,
      customPrice: ingredient.price || "0.00",
      isActive: true,
    };

    setSelectedIngredients(prev => [
      ...prev.filter(i => i.ingredientId !== ingredientId),
      newIngredientConfig
    ]);

    toast({
      title: "Ingrediente adicionado!",
      description: `${ingredient.name} foi adicionado ao produto.`,
    });
  };

  const updateIngredient = (ingredientId: string, updates: Partial<ProductIngredientConfig>) => {
    setSelectedIngredients(prev =>
      prev.map(ing => 
        ing.ingredientId === ingredientId ? { ...ing, ...updates } : ing
      )
    );
  };

  const removeIngredient = (ingredientId: string) => {
    setSelectedIngredients(prev => prev.filter(i => i.ingredientId !== ingredientId));
  };

  const getIngredientsByCategory = (category: string) => {
    return ingredients.filter(ingredient => ingredient.category === category);
  };

  const isIngredientSelected = (ingredientId: string) => {
    return selectedIngredients.some(i => i.ingredientId === ingredientId);
  };

  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <Label className="text-base font-semibold flex items-center">
          <ChefHat className="mr-2 h-4 w-4" />
          Ingredientes do Produto
        </Label>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os ingredientes que compõem este produto e suas opções de personalização
        </p>
      </div>

      {/* Ingredientes Selecionados */}
      {selectedIngredients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Ingredientes Configurados ({selectedIngredients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedIngredients.map((ingredientConfig) => {
                const ingredient = ingredients.find(i => i.id === ingredientConfig.ingredientId);
                if (!ingredient) return null;

                return (
                  <div key={ingredientConfig.ingredientId} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({ingredient.category})
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeIngredient(ingredientConfig.ingredientId)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Preço Adicional (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={ingredientConfig.customPrice || "0.00"}
                          onChange={(e) => updateIngredient(ingredientConfig.ingredientId, { customPrice: e.target.value })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Quantidade Máxima</Label>
                        <Input
                          type="number"
                          min="1"
                          value={ingredientConfig.quantity}
                          onChange={(e) => updateIngredient(ingredientConfig.ingredientId, { quantity: parseInt(e.target.value) || 1 })}
                          className="h-8"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={ingredientConfig.isIncludedByDefault}
                          onCheckedChange={(checked) => updateIngredient(ingredientConfig.ingredientId, { isIncludedByDefault: checked })}
                        />
                        <Label className="text-xs">Incluído por padrão</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={ingredientConfig.isActive}
                          onCheckedChange={(checked) => updateIngredient(ingredientConfig.ingredientId, { isActive: checked })}
                        />
                        <Label className="text-xs">Ativo</Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seleção de Ingredientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Adicionar Ingredientes</CardTitle>
            <QuickAddIngredientModal onIngredientAdded={(ingredientId) => addIngredient(ingredientId)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { key: 'protein', label: '🥩 Carnes', icon: '🥩' },
              { key: 'cheese', label: '🧀 Queijos', icon: '🧀' },
              { key: 'vegetable', label: '🥬 Vegetais', icon: '🥬' },
              { key: 'sauce', label: '🍯 Molhos', icon: '🍯' },
              { key: 'bread', label: '🍞 Pães', icon: '🍞' },
              { key: 'extra', label: '✨ Extras', icon: '✨' }
            ].map(category => {
              const categoryIngredients = getIngredientsByCategory(category.key);
              if (categoryIngredients.length === 0) return null;

              return (
                <div key={category.key} className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {category.label}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {categoryIngredients.map(ingredient => (
                      <Button
                        key={ingredient.id}
                        variant={isIngredientSelected(ingredient.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => addIngredient(ingredient.id)}
                        disabled={isIngredientSelected(ingredient.id)}
                        className="h-8 text-xs"
                      >
                        {category.icon} {ingredient.name}
                        {parseFloat(ingredient.price || "0") > 0 && (
                          <span className="ml-1 text-xs">
                            (+R$ {parseFloat(ingredient.price || "0").toFixed(2)})
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isCreating && selectedIngredients.length === 0 && (
        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
          💡 <strong>Dica:</strong> Adicione ingredientes para que os clientes possam personalizar este produto
        </div>
      )}
    </div>
  );
}

// Quick Add Ingredient Modal
interface QuickAddIngredientModalProps {
  onIngredientAdded: (ingredientId: string) => void;
}

function QuickAddIngredientModal({ onIngredientAdded }: QuickAddIngredientModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "extra",
    price: "0.00",
    discountPrice: "0.00",
    isRemovable: true,
    isRequired: false,
    maxQuantity: 3,
    isActive: true,
  });

  const createIngredientMutation = useMutation({
    mutationFn: async (ingredientData: any) => {
      const data = {
        ...ingredientData,
        price: parseFloat(ingredientData.price) || 0,
        discountPrice: parseFloat(ingredientData.discountPrice) || 0,
      };
      const response = await apiRequest("POST", "/api/ingredients", data);
      return response.json();
    },
    onSuccess: (newIngredient) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      onIngredientAdded(newIngredient.id);
      setOpen(false);
      setFormData({
        name: "",
        category: "extra",
        price: "0.00",
        discountPrice: "0.00",
        isRemovable: true,
        isRequired: false,
        maxQuantity: 3,
        isActive: true,
      });
      toast({
        title: "Ingrediente criado!",
        description: `${newIngredient.name} foi criado e adicionado ao produto.`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao criar ingrediente",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do ingrediente.",
        variant: "destructive",
      });
      return;
    }
    createIngredientMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-3 w-3" />
          Criar Ingrediente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Novo Ingrediente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ingredientName">Nome *</Label>
            <Input
              id="ingredientName"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Bacon extra"
            />
          </div>

          <div>
            <Label htmlFor="ingredientCategory">Categoria *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="protein">🥩 Carnes</SelectItem>
                <SelectItem value="cheese">🧀 Queijos</SelectItem>
                <SelectItem value="vegetable">🥬 Vegetais</SelectItem>
                <SelectItem value="sauce">🍯 Molhos</SelectItem>
                <SelectItem value="bread">🍞 Pães</SelectItem>
                <SelectItem value="extra">✨ Extras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ingredientPrice">Preço Adicional (R$)</Label>
              <Input
                id="ingredientPrice"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="maxQuantity">Quantidade Máxima</Label>
              <Input
                id="maxQuantity"
                type="number"
                min="1"
                value={formData.maxQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, maxQuantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRemovable}
                onChange={(e) => setFormData(prev => ({ ...prev, isRemovable: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Removível</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, isRequired: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Obrigatório</span>
            </label>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={createIngredientMutation.isPending}
              className="flex-1"
            >
              {createIngredientMutation.isPending ? "Criando..." : "Criar e Adicionar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}