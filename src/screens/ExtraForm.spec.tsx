import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ExtraForm } from './ExtraForm';
import type { Product } from '../lib/contract';

const create = vi.fn();
const update = vi.fn();
let products: Product[] = [];

vi.mock('../hooks/useProducts', () => ({
  useProducts: () => ({ products, total: products.length, isLoading: false }),
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
  dishIds: [],
  choices: [],
  createdAt: '',
  updatedAt: '',
  ...over,
});

const menu = [
  product({ id: 'beans', name: 'Rice and beans' }),
  product({ id: 'stew', name: 'Rice and stew', price: '1500' }),
  product({ id: 'chapman', name: 'Chapman', price: '800' }),
];

function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/extras/new" element={<ExtraForm />} />
        <Route path="/extras/:id" element={<ExtraForm />} />
        <Route path="/extras" element={<p>extras list</p>} />
        <Route path="/products/:id" element={<p>product form</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ExtraForm — an extra on its own form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    products = [...menu];
    create.mockResolvedValue({});
    update.mockResolvedValue({});
  });

  it('adds a Takeaway pack, on every product but the one unticked', async () => {
    const user = userEvent.setup();
    open('/extras/new');

    expect(
      screen.getByRole('heading', { name: 'Add Extra' }),
    ).toBeInTheDocument();
    // A new extra starts on every product.
    expect(screen.getByLabelText(/Rice and beans/)).toBeChecked();
    expect(screen.getByLabelText(/Chapman/)).toBeChecked();

    await user.type(screen.getByLabelText('Extra name'), 'Takeaway pack');
    await user.type(screen.getByLabelText('Price'), '200');
    await user.click(screen.getByLabelText(/Chapman/));
    await user.click(screen.getByRole('button', { name: 'Save extra' }));

    expect(create).toHaveBeenCalledWith({
      name: 'Takeaway pack',
      price: 200,
      imageUrl: undefined,
      isAvailable: true,
      isAddOn: true,
      dishIds: ['beans', 'stew'],
    });
    expect(await screen.findByText('extras list')).toBeInTheDocument();
  });

  it('edits an extra with the products it is on now', async () => {
    const user = userEvent.setup();
    products = [
      ...menu,
      product({ id: 'beef', name: 'Beef', isAddOn: true, dishIds: ['stew'] }),
    ];
    open('/extras/beef');

    expect(screen.getByLabelText(/Rice and stew/)).toBeChecked();
    expect(screen.getByLabelText(/Rice and beans/)).not.toBeChecked();

    await user.click(screen.getByLabelText(/Rice and beans/));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(update).toHaveBeenCalledWith({
      id: 'beef',
      changes: expect.objectContaining({
        name: 'Beef',
        isAddOn: true,
        dishIds: ['stew', 'beans'],
      }),
    });
  });

  it('sends a product opened here to the product form', () => {
    open('/extras/stew');

    expect(screen.getByText('product form')).toBeInTheDocument();
  });

  it('asks for a name and a price', async () => {
    const user = userEvent.setup();
    open('/extras/new');

    await user.click(screen.getByRole('button', { name: 'Save extra' }));

    expect(create).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a price')).toBeInTheDocument();
  });
});
