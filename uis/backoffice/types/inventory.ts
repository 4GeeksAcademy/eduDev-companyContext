export type Warehouse = 'LA' | 'ZGZ';
export type Direction = 'inbound' | 'outbound';
export type ExitType = 'dispatch' | 'loss';
export interface Product {
  id: number;
  name: string;
  sku: string;
  client_name: string;
  category: 'fashion' | 'electronics' | 'cosmetics';
  warehouse: Warehouse;
  current_stock: number;
}
export interface MovementInput {
  sku_id: number;
  quantity: number;
  warehouse: Warehouse;
}
export interface EntryInput extends MovementInput { reference: string }
export interface ExitInput extends MovementInput { exit_type: ExitType; tracking_number: string | null }
interface Movement extends Omit<Product, 'id' | 'current_stock' | 'category'> {
  id: string;
  sku_id: number;
  category: string;
  quantity: number;
  created_at: string;
  user_uuid: string;
}
export type Order = (Movement & EntryInput & { order_type: 'inbound' }) |
  (Movement & ExitInput & { order_type: 'outbound' });
