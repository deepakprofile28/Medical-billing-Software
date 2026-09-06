import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface SalesTransaction {
  id?: number;
  transactionNo: string;
  transactionDate?: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesOrder {
  id?: number;
  orderNo: string;
  orderDate?: string;
  customerName: string;
  customerPhone?: string;
  itemCount?: number;
  totalAmount: number;
  orderStatus?: string;
  status?: string;
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuspendedOrder {
  id?: number;
  holdNo: string;
  holdDate?: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  holdReason?: string;
  suspendedStatus?: string;
  status?: string;
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompletedSale {
  id?: number;
  invoiceNo: string;
  completionDate?: string;
  customerName: string;
  paymentMethod?: string;
  totalAmount: number;
  netAmount: number;
  status?: string;
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesExchange {
  id?: number;
  exchangeNo: string;
  originalBillNo: string;
  customerName: string;
  returnedItem: string;
  newItem: string;
  priceDifference?: number;
  exchangeDate?: string;
  exchangeStatus?: string;
  status?: string;
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesReturn {
  id?: number;
  returnNo: string;
  originalBillNo: string;
  customerName: string;
  returnReason?: string;
  refundAmount: number;
  refundMethod?: string;
  refundStatus?: string;
  returnDate?: string;
  status?: string;
  companyId?: number | string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  private baseUrl = 'http://localhost:8082/api/sales';

  constructor(private http: HttpClient) {}

  private getCompanyId(companyId?: number | string): string {
    return (companyId || localStorage.getItem('companyId') || '1').toString();
  }

  // 1. TRANSACTIONS
  getTransactions(companyId?: number | string): Observable<SalesTransaction[]> {
    return this.http.get<SalesTransaction[]>(`${this.baseUrl}/transactions?companyId=${this.getCompanyId(companyId)}`).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }
  createTransaction(txn: SalesTransaction, companyId?: number | string): Observable<SalesTransaction> {
    return this.http.post<SalesTransaction>(`${this.baseUrl}/transactions?companyId=${this.getCompanyId(companyId)}`, txn);
  }
  updateTransaction(id: number, txn: SalesTransaction): Observable<SalesTransaction> {
    return this.http.put<SalesTransaction>(`${this.baseUrl}/transactions/${id}`, txn);
  }
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/transactions/${id}`);
  }

  // 2. ORDERS
  getOrders(companyId?: number | string): Observable<SalesOrder[]> {
    return this.http.get<SalesOrder[]>(`${this.baseUrl}/orders?companyId=${this.getCompanyId(companyId)}`).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }
  createOrder(order: SalesOrder, companyId?: number | string): Observable<SalesOrder> {
    return this.http.post<SalesOrder>(`${this.baseUrl}/orders?companyId=${this.getCompanyId(companyId)}`, order);
  }
  updateOrder(id: number, order: SalesOrder): Observable<SalesOrder> {
    return this.http.put<SalesOrder>(`${this.baseUrl}/orders/${id}`, order);
  }
  deleteOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/orders/${id}`);
  }

  // 3. SUSPENDED ORDERS
  getSuspended(companyId?: number | string): Observable<SuspendedOrder[]> {
    return this.http.get<SuspendedOrder[]>(`${this.baseUrl}/suspended?companyId=${this.getCompanyId(companyId)}`).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }
  createSuspended(suspended: SuspendedOrder, companyId?: number | string): Observable<SuspendedOrder> {
    return this.http.post<SuspendedOrder>(`${this.baseUrl}/suspended?companyId=${this.getCompanyId(companyId)}`, suspended);
  }
  updateSuspended(id: number, suspended: SuspendedOrder): Observable<SuspendedOrder> {
    return this.http.put<SuspendedOrder>(`${this.baseUrl}/suspended/${id}`, suspended);
  }
  deleteSuspended(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/suspended/${id}`);
  }

  // 4. COMPLETED SALES
  getCompleted(companyId?: number | string): Observable<CompletedSale[]> {
    return this.http.get<CompletedSale[]>(`${this.baseUrl}/completed?companyId=${this.getCompanyId(companyId)}`).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }
  createCompleted(completed: CompletedSale, companyId?: number | string): Observable<CompletedSale> {
    return this.http.post<CompletedSale>(`${this.baseUrl}/completed?companyId=${this.getCompanyId(companyId)}`, completed);
  }
  updateCompleted(id: number, completed: CompletedSale): Observable<CompletedSale> {
    return this.http.put<CompletedSale>(`${this.baseUrl}/completed/${id}`, completed);
  }
  deleteCompleted(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/completed/${id}`);
  }

  // 5. EXCHANGES
  getExchanges(companyId?: number | string): Observable<SalesExchange[]> {
    return this.http.get<SalesExchange[]>(`${this.baseUrl}/exchanges?companyId=${this.getCompanyId(companyId)}`).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }
  createExchange(exc: SalesExchange, companyId?: number | string): Observable<SalesExchange> {
    return this.http.post<SalesExchange>(`${this.baseUrl}/exchanges?companyId=${this.getCompanyId(companyId)}`, exc);
  }
  updateExchange(id: number, exc: SalesExchange): Observable<SalesExchange> {
    return this.http.put<SalesExchange>(`${this.baseUrl}/exchanges/${id}`, exc);
  }
  deleteExchange(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/exchanges/${id}`);
  }

  // 6. RETURNS & REFUNDS
  getReturns(companyId?: number | string): Observable<SalesReturn[]> {
    return this.http.get<SalesReturn[]>(`${this.baseUrl}/returns?companyId=${this.getCompanyId(companyId)}`).pipe(
      catchError(err => { console.error(err); return of([]); })
    );
  }
  createReturn(ret: SalesReturn, companyId?: number | string): Observable<SalesReturn> {
    return this.http.post<SalesReturn>(`${this.baseUrl}/returns?companyId=${this.getCompanyId(companyId)}`, ret);
  }
  updateReturn(id: number, ret: SalesReturn): Observable<SalesReturn> {
    return this.http.put<SalesReturn>(`${this.baseUrl}/returns/${id}`, ret);
  }
  deleteReturn(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/returns/${id}`);
  }
}

