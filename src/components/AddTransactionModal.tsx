import React, { useState, useEffect } from 'react';
import { useI18n } from '@/hooks/use-i18n';
import { Transaction, TransactionType, Category } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Scan } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type AddTransactionModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  categories: Category[];
  isLoading?: boolean;
};

export default function AddTransactionModal({ 
  visible, 
  onDismiss, 
  onSave, 
  categories 
}: AddTransactionModalProps) {
  const { t } = useI18n();
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [category, setCategory] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset form when modal opens
      setType('expense');
      setAmount('');
      setDate(new Date());
      setCategory('');
      setMerchant('');
      setNotes('');
      setIsSaving(false);
    }
  }, [visible]);

  const filteredCategories = categories.filter(c => c.type === type);

  const handleScanReceipt = async () => {
    try {
      setIsScanning(true);
      // Simular escaneo de recibo
      setTimeout(() => {
        setMerchant('Tienda de Prueba');
        setAmount('25.99');
        setIsScanning(false);
      }, 2000);
    } catch (error) {
      console.error('Error scanning receipt:', error);
      setIsScanning(false);
    }
  };

  const handleSave = async () => {
    if (!amount || !category) return;

    setIsSaving(true);

    try {
      const transaction: Omit<Transaction, 'id'> = {
        type,
        amount: parseFloat(amount),
        date: date.toISOString(),
        category,
        merchant: merchant || undefined,
        notes: notes || undefined,
      };

      // Solo llamar al callback onSave - el componente padre se encarga de guardar
      onSave(transaction);
      
      // Cerrar el modal
      onDismiss();
    } catch (error) {
      console.error('Error al guardar transacción:', error);
      alert('Error al guardar la transacción. Por favor, intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <Dialog open={visible} onOpenChange={onDismiss}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('add_transaction_dialog.title')}</DialogTitle>
          <DialogDescription>
            {t('add_transaction_dialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Botón de escaneo */}
          <Button
            variant="outline"
            onClick={handleScanReceipt}
            disabled={isScanning}
            className="w-full"
          >
            {isScanning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                {t('add_transaction_dialog.scanning')}
              </>
            ) : (
              <>
                <Scan className="mr-2 h-4 w-4" />
                {t('add_transaction_dialog.scan_receipt')}
              </>
            )}
          </Button>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t('add_transaction_dialog.or_manual')}
              </span>
            </div>
          </div>

          {/* Tipo de transacción */}
          <div className="grid grid-cols-2 gap-2">
             <Button
               variant={type === 'expense' ? 'destructive' : 'outline'}
               onClick={() => setType('expense')}
             >
               {t('common.expense')}
             </Button>
             <Button
               variant={type === 'income' ? 'default' : 'outline'}
               onClick={() => setType('income')}
             >
               {t('common.income')}
             </Button>
           </div>

          {/* Monto */}
          <div className="grid gap-2">
            <Label htmlFor="amount">{t('add_transaction_dialog.amount')}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Fecha y Categoría */}
          <div className="grid grid-cols-2 gap-4">
            {/* Fecha */}
            <div className="grid gap-2">
              <Label>{t('add_transaction_dialog.date')}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(day) => day && setDate(day)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Categoría */}
            <div className="grid gap-2">
              <Label htmlFor="category">{t('add_transaction_dialog.category')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder={t('add_transaction_dialog.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {t(cat.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Comerciante */}
          <div className="grid gap-2">
            <Label htmlFor="merchant">{t('add_transaction_dialog.merchant')}</Label>
            <Input
              id="merchant"
              placeholder={t('add_transaction_dialog.merchant_placeholder')}
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div className="grid gap-2">
            <Label htmlFor="notes">{t('add_transaction_dialog.notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('add_transaction_dialog.notes_placeholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onDismiss} disabled={isSaving}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!amount || !category || isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Guardando...
              </>
            ) : (
              t('add_transaction_dialog.save_transaction')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}