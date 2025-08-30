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
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Upload, Edit3, Trash2, Plus, Save, X, ToggleLeft, ToggleRight, Image, MapPin, Settings, Tags } from "lucide-react";
import { AdminDeliveryZones } from "@/components/admin-delivery-zones";
import type { Product, Category, DeliveryZone, StoreSettings } from "@shared/schema";

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
}

interface EditingDeliveryZone {
  id?: string;
  neighborhoodName: string;
  deliveryFee: string;
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

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: deliveryZones = [] } = useQuery<DeliveryZone[]>({
    queryKey: ["/api/delivery-zones"],
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

  const handleEdit = (product: Product) => {
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
              <Button 
                onClick={startNewProduct}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                data-testid="button-new-product"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Produto
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products" className="flex items-center">
              <Edit3 className="mr-2 h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center">
              <Tags className="mr-2 h-4 w-4" />
              Categorias
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

          <TabsContent value="banner" className="space-y-6">
            <BannerManagement />
          </TabsContent>

          <TabsContent value="store-info" className="space-y-6">
            <StoreInfoManagement />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <CategoryManagement />
          </TabsContent>

          <TabsContent value="delivery">
            <AdminDeliveryZones />
          </TabsContent>
        </Tabs>
      </div>
    </div>
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
            type="number"
            step="0.01"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
            placeholder="18.90"
            data-testid="input-product-price"
          />
        </div>
        <div>
          <Label htmlFor="originalPrice">Preço Original (opcional)</Label>
          <Input
            id="originalPrice"
            type="number"
            step="0.01"
            value={product.originalPrice}
            onChange={(e) => setProduct({ ...product, originalPrice: e.target.value })}
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
        {/* Título e Imagem da Loja */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Seção Principal</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="store-title">Título da Seção</Label>
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