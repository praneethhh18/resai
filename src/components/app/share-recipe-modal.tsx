'use client';

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, UploadCloud, X, ChevronLeft, ChevronRight, ChefHat, FileText, Image as ImageIcon, CheckCircle, type LucideIcon } from 'lucide-react';
import { submitUserRecipe } from '@/lib/actions';
import Image from 'next/image';
import type { User } from 'firebase/auth';
import { Progress } from '../ui/progress';
import { AnimatePresence, motion } from 'framer-motion';

interface ShareRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const recipeFormSchema = z
  .object({
    name: z.string().min(3, "Recipe name must be at least 3 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    image: z.union([z.instanceof(File), z.undefined()]),
    ingredients: z
      .array(
        z.object({
          name: z.string().min(1, "Ingredient name can't be empty."),
          measure: z.string().min(1, "Measure can't be empty."),
        })
      )
      .min(1, "At least one ingredient is required."),
    instructions: z.string().min(20, "Instructions must be at least 20 characters long."),
  })
  .superRefine((values, ctx) => {
    if (!(values.image instanceof File)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['image'],
        message: "A recipe image is required.",
      });
    }
  });

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

type StepConfig = {
  id: string;
  name: string;
  icon: LucideIcon;
  fields?: Array<keyof RecipeFormValues>;
};

const steps = [
  { id: 'Step 1', name: 'The Basics', fields: ['name', 'description'], icon: ChefHat },
  { id: 'Step 2', name: 'The Look', fields: ['image'], icon: ImageIcon },
  { id: 'Step 3', name: 'The Details', fields: ['ingredients', 'instructions'], icon: FileText },
  { id: 'Step 4', name: 'Review', icon: CheckCircle },
] satisfies StepConfig[];

export function ShareRecipeModal({ isOpen, onClose, user }: ShareRecipeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      name: '',
      description: '',
      image: undefined,
      ingredients: [{ name: '', measure: '' }],
      instructions: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('image', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RecipeFormValues) => {
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append('authorId', user.uid);
    formData.append('authorName', user.displayName || 'Anonymous');
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('instructions', data.instructions);
    formData.append('ingredients', JSON.stringify(data.ingredients));
    if (!(data.image instanceof File)) {
      toast({
        variant: "destructive",
        title: "Image Required",
        description: "Please upload a recipe image before submitting.",
      });
      setIsSubmitting(false);
      return;
    }
    formData.append('image', data.image);

    const result = await submitUserRecipe(formData);

    if (result.success) {
      toast({
        title: "Recipe Submitted!",
        description: "Thank you for sharing your recipe with the community.",
      });
      resetFormAndClose();
    } else {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: result.message,
      });
    }
    setIsSubmitting(false);
  };
  
  const resetFormAndClose = () => {
      form.reset();
      setImagePreview(null);
      setCurrentStep(0);
      onClose();
  }

  const handleClose = (open: boolean) => {
    if (!open && !isSubmitting) {
        resetFormAndClose();
    }
  };
  
  const handleRemoveImage = () => {
    setImagePreview(null);
    form.setValue('image', undefined, { shouldValidate: true });
     if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const nextStep = async () => {
    const currentFields = steps[currentStep]?.fields;
    if (currentFields && currentFields.length > 0) {
      const isValid = await form.trigger(currentFields, { shouldFocus: true });
      if (!isValid) {
        return;
      }
    }
    if (currentStep < steps.length - 1) {
        setCurrentStep(step => step + 1);
    }
  }
  
  const prevStep = () => {
    if (currentStep > 0) {
        setCurrentStep(step => step - 1);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl w-full h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Share Your Culinary Creation</DialogTitle>
          <DialogDescription>
            Follow the steps to add your recipe to the Dish Directory.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-4">
            <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-y-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 0 && (
                    <div className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg font-semibold">Recipe Name</FormLabel>
                                <FormControl>
                                <Input placeholder="e.g., Grandma's Famous Lasagna" {...field} className="h-12 text-base"/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg font-semibold">Short Description</FormLabel>
                                <FormControl>
                                <Textarea placeholder="A short, enticing description of your dish..." {...field} rows={5} className="text-base"/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                  )}

                  {currentStep === 1 && (
                     <FormField
                        control={form.control}
                        name="image"
                        render={() => (
                        <FormItem className="flex-grow flex flex-col h-[50vh]">
                            <FormControl>
                                <div 
                                    className="relative w-full h-full flex justify-center items-center p-4 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/80 transition-colors bg-muted/20"
                                    onClick={() => !imagePreview && fileInputRef.current?.click()}
                                >
                                    {imagePreview ? (
                                        <>
                                            <Image src={imagePreview} alt="Preview" fill className="object-contain rounded-lg"/>
                                            <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 z-10 h-8 w-8" onClick={handleRemoveImage}>
                                                <X className="h-4 w-4" />
                                                <span className="sr-only">Remove image</span>
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="space-y-2 text-center text-muted-foreground">
                                            <UploadCloud className="mx-auto h-12 w-12" />
                                            <p className="font-semibold text-foreground">Click to upload a photo</p>
                                            <p className="text-xs">PNG, JPG, or GIF up to 10MB</p>
                                        </div>
                                    )}
                                    <Input 
                                        ref={fileInputRef}
                                        id="file-upload" 
                                        name="image" 
                                        type="file" 
                                        className="sr-only" 
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </FormControl>
                            <FormMessage className="pt-2"/>
                        </FormItem>
                        )}
                    />
                  )}
                  
                  {currentStep === 2 && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="font-semibold text-lg mb-4">Ingredients</h3>
                            <div className="space-y-4">
                                {fields.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-start gap-2"
                                >
                                    <FormField
                                        control={form.control}
                                        name={`ingredients.${index}.measure`}
                                        render={({ field }) => (
                                            <FormItem className="w-1/3">
                                                <FormControl>
                                                    <Input placeholder="1 cup" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    <FormField
                                    control={form.control}
                                    name={`ingredients.${index}.name`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                        <FormControl>
                                                <Input placeholder="All-purpose flour" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                    />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="mt-1 flex-shrink-0 text-muted-foreground hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                                ))}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() => append({ name: '', measure: '' })}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Ingredient
                            </Button>
                        </div>
                    
                        <FormField
                            control={form.control}
                            name="instructions"
                            render={({ field }) => (
                            <FormItem>
                                <h3 className="font-semibold text-lg">Instructions</h3>
                                <FormControl>
                                <Textarea placeholder="Provide step-by-step instructions. Please put each step on a new line." rows={12} {...field} className="mt-2"/>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                  )}

                  {currentStep === 3 && (
                      <div>
                          <h3 className="font-semibold text-lg text-center mb-6">Ready to Share?</h3>
                           <div className="space-y-6 max-w-lg mx-auto">
                              <div className="relative aspect-video rounded-lg overflow-hidden border">
                                  {imagePreview ? <Image src={imagePreview} alt={form.getValues('name')} fill className="object-cover" /> : <div className="bg-muted h-full w-full flex items-center justify-center text-muted-foreground">No Image</div>}
                              </div>
                              <div>
                                  <h4 className="font-bold text-2xl">{form.getValues('name')}</h4>
                                  <p className="text-muted-foreground mt-1">{form.getValues('description')}</p>
                              </div>
                               <Button size="sm" variant="link" onClick={() => setCurrentStep(0)}>Edit Basics</Button>
                           </div>
                      </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            <DialogFooter className="p-6 border-t bg-background flex-shrink-0">
                <div className="flex justify-between w-full">
                    <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 0 || isSubmitting}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    
                    {currentStep < steps.length - 1 ? (
                        <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                         <Button type="submit" disabled={isSubmitting} className="w-40">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Share My Recipe'}
                        </Button>
                    )}
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
