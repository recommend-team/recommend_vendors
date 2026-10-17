import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProductForm } from './ProductForm';
import type { Product } from '../lib/contract';

const create = vi.fn();
const update = vi.fn();
let products: Product[] = [];

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => ({ products, total: products.length }),
  useCreateProduct: () => ({ mutateAsync: create, isPending: false }),
  useUpdateProduct: () => ({ mutateAsync: update, isPending: false }),
  useDeleteProduct: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('../components/ui/ImageUpload', () => ({ ImageUpload: () => null }));

const product = (over: Partial<Product>): Product => ({
  id: 'p',
  vendorId: 'v',
  name: 'Item',
  description: null,
  price: '1000',
  imageUrl: null,
  isAvailable: true,
  isAddOn: false,
  unit: null,
  extraIds: [],
  choices: [],
  createdAt: '',
  updatedAt: '',
  ...over,
});

const extras = [
  product({ id: 'beef', name: 'Beef', isAddOn: true }),
  product({
    id: 'takeaway',
    name: 'Takeaway pack',
    price: '200',
    isAddOn: true,
  }),
  product({ id: 'water', name: 'Water', price: '300', isAddOn: true }),
];

function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductForm />} />
        <Route path="/products" element={<p>list</p>} />
        <Route path="/extras/:id" element={<p>extra form</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProductForm — dishes with units, extras and choices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    products = [...extras];
    create.mockResolvedValue({});
    update.mockResolvedValue({});
  });

  it('adds Rice and stew per portion, with extras ticked and a required protein', async () => {
    const user = userEvent.setup();
    open('/products/new');

    await user.type(screen.getByLabelText('Product name'), 'Rice and stew');
    await user.type(screen.getByLabelText('Price'), '1500');
    await user.selectOptions(screen.getByLabelText('Price is per'), 'portion');
    await user.click(screen.getByLabelText(/^Takeaway pack/));
    await user.click(screen.getByLabelText(/^Water/));

    await user.click(screen.getByRole('button', { name: '+ Add a choice' }));
    await user.type(
      screen.getByLabelText('Choice 1 name'),
      'Choose your protein',
    );
    await user.type(screen.getByLabelText('Option 1'), 'Chicken');
    await user.type(screen.getByLabelText('Option 2'), 'Beef');
    await user.click(screen.getByRole('button', { name: '+ Add option' }));
    await user.type(screen.getByLabelText('Option 3'), 'Fish');
    await user.type(
      screen.getByLabelText('Extra cost for Fish, per portion'),
      '300',
    );

    await user.click(screen.getByRole('button', { name: 'Save product' }));

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Rice and stew',
        price: 1500,
        isAddOn: false,
        unit: 'portion',
        extraIds: ['takeaway', 'water'],
        choices: [
          {
            name: 'Choose your protein',
            required: true,
            minPick: 1,
            maxPick: 1,
            options: [
              { name: 'Chicken', priceDelta: 0, isAvailable: true },
              { name: 'Beef', priceDelta: 0, isAvailable: true },
              { name: 'Fish', priceDelta: 300, isAvailable: true },
            ],
          },
        ],
      }),
    );
  });

  it('says what is wrong with a choice instead of saving it', async () => {
    const user = userEvent.setup();
    open('/products/new');

    await user.type(screen.getByLabelText('Product name'), 'Rice');
    await user.type(screen.getByLabelText('Price'), '1000');
    await user.click(screen.getByRole('button', { name: '+ Add a choice' }));
    await user.click(screen.getByRole('button', { name: 'Save product' }));

    expect(create).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/Name the choice/);
  });

  it('keeps ids when editing, and can mark an option out', async () => {
    const user = userEvent.setup();
    products = [
      ...extras,
      product({
        id: 'stew',
        name: 'Rice and stew',
        unit: 'portion',
        extraIds: ['water'],
        choices: [
          {
            id: 'g1',
            name: 'Choose your protein',
            required: true,
            minPick: 1,
            maxPick: 1,
            options: [
              { id: 'o1', name: 'Chicken', priceDelta: 0, isAvailable: true },
              { id: 'o3', name: 'Fish', priceDelta: 300, isAvailable: true },
            ],
          },
        ],
      }),
    ];
    open('/products/stew');

    await user.click(
      screen.getByRole('button', {
        name: /Fish available — tap when it runs out/,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(update).toHaveBeenCalledWith({
      id: 'stew',
      changes: expect.objectContaining({
        unit: 'portion',
        extraIds: ['water'],
        choices: [
          expect.objectContaining({
            id: 'g1',
            options: [
              { id: 'o1', name: 'Chicken', priceDelta: 0, isAvailable: true },
              { id: 'o3', name: 'Fish', priceDelta: 300, isAvailable: false },
            ],
          }),
        ],
      }),
    });
  });

  it('is only ever for products — it never turns into an extra', () => {
    open('/products/new');

    expect(
      screen.getByRole('heading', { name: 'Add Product' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('This is an extra')).not.toBeInTheDocument();
  });

  it('sends an extra opened here to the extra form', () => {
    open('/products/beef');

    expect(screen.getByText('extra form')).toBeInTheDocument();
  });

  it('points to the Extras screen when there are none to tick', () => {
    products = [];
    open('/products/new');

    const note = screen.getByText(/You have no extras yet/);
    expect(
      within(note).getByRole('link', { name: 'Add your extras' }),
    ).toHaveAttribute('href', '/extras/new');
  });
});
