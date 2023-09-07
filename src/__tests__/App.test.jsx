import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {render, screen, fireEvent} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App';

const server = setupServer(
  rest.get('/api/movies', (req, res, ctx) => {
    return res(ctx.json([{ movieId: 1, title: 'Test Movie' }]));
  }),
  rest.get('/api/ratings', (req, res, ctx) => {
    return res(
      ctx.json([
        {
          ratingId: 1,
          score: 2,
          movieId: 1,
          movie: {
            title: 'Test Movie',
          },
        },
      ]),
    );
  }),
  rest.get('/api/movies/:movieId', (req, res, ctx) => {
    return res(
      ctx.json({
        movieId: 1,
        title: 'Test Movie',
        posterPath: 'poster.jpg',
        overview: 'Test overview',
      }),
    );
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders homepage at /', async () => {
  render(<App />)
  expect(screen.getByRole('heading', {name: /movie ratings app/i})).toBeInTheDocument()
});

describe('page navigation', () => {
  test('can navigate to all movies page', async () => {
    render(<App/>)
    const user = userEvent.setup()

    await user.click(screen.getByRole('link', {name: /all movies/i}))
    expect(screen.getByRole('heading', {name: /all movies/i})).toBeInTheDocument()
  });

  test('can navigate to the login page', async () => {
    render(<App />);
    const user = userEvent.setup();
  
    await user.click(screen.getByRole('link', { name: /log in/i }));
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  });

  test('can navigate to the user ratings page', async () => {
    server.use();
  
    render(<App />);
    const user = userEvent.setup();
  
    await user.click(screen.getByRole('link', { name: /your ratings/i }));
    expect(screen.getByRole('heading', { name: /your ratings/i })).toBeInTheDocument();
  });

  test('can navigate to a movie detail page', async () => {
    render(<App />);
    const user = userEvent.setup();
  
    // Navigate to All Movies page, then click on a movie
    await user.click(screen.getByRole('link', { name: /all movies/i }));
    await user.click(screen.getByRole('link', { name: /test movie/i }));
    expect(screen.getByRole('heading', { name: /test movie/i })).toBeInTheDocument();
  });
});

test('logging in redirects to user ratings page', async () => {
  // Enable login for this test
  server.use(
    rest.post('/api/auth', (req, res, ctx) => {
      return res(ctx.json({ success: true }));
    }),
  );

  render(<App />);
  const user = userEvent.setup();

  // Navigate to login page
  await user.click(screen.getByRole('link', { name: /log in/i }));
  // Log in
  await user.type(screen.getByLabelText(/email/i), 'test@test.com');
  await user.type(screen.getByLabelText(/password/i), 'test');
  await user.click(screen.getByRole('button', { name: /log in/i }));
  // Redirects to user ratings page
  expect(screen.getByRole('heading', { name: /your ratings/i })).toBeInTheDocument();
});

test('creating a rating redirects to user ratings page', async () => {
  // Route for creating a rating
  server.use(
    rest.post('/api/ratings', (req, res, ctx) => {
      return res(ctx.json({ ratingId: 1, score: 2 }));
    }),
  );

  render(<App />);
  const user = userEvent.setup();

  // Navigate to movie detail page
  await user.click(screen.getByRole('link', { name: /all movies/i }));
  await user.click(screen.getByRole('link', { name: /test movie/i }));
  // Create a rating
  fireEvent.change(screen.getByRole('combobox', { name: /score/i }), { target: { value: '1' } });
  await user.click(screen.getByRole('button', { name: /submit/i }));
  // Redirects to user ratings page
  expect(screen.getByRole('heading', { name: /your ratings/i })).toBeInTheDocument();
});
