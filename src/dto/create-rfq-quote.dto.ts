export class CreateRfqQuoteDto {
  instrument: string;
  quantity: number;
  fees_in_price: boolean;
  dry_run: boolean;
}
