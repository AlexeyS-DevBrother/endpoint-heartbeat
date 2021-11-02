import { PipeTransform } from '@nestjs/common';
import { CreateRfqQuoteDto } from '../dto/create-rfq-quote.dto';

export class RfqQuoteInfo implements PipeTransform {
  transform(raw: {
    instrument: string;
    quantity: string;
    fees_in_price: string;
    dry_run: string;
  }): CreateRfqQuoteDto {
    const quantity = +raw.quantity;
    const dry_run = this.parseBoolean(raw.dry_run);
    const fees_in_price = this.parseBoolean(raw.fees_in_price);
    return { ...raw, quantity, dry_run, fees_in_price };
  }

  private parseBoolean(prop: string): boolean {
    if (prop === 'true') return true;
    else if (prop === 'false') return false;
    else prop;
  }
}
