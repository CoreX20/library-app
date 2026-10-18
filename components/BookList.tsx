import BookCard from "@/components/BookCard";

interface Props {
  /** Omitted when the surrounding page already states the context. */
  title?: string;
  books: Book[];
  containerClassName?: string;
  /** Shown instead of hiding the section when the list is empty. */
  emptyMessage?: string;
}

const BookList = ({
  title,
  books,
  containerClassName,
  emptyMessage,
}: Props) => {
  if (books.length === 0) {
    if (!emptyMessage) return null;

    return (
      <section className={containerClassName}>
        {title && (
          <h2 className="font-bebas-neue text-4xl text-light-100">{title}</h2>
        )}
        <p className="mt-4 max-w-xl text-light-100">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className={containerClassName}>
      {title && (
        <h2 className="font-bebas-neue text-4xl text-light-100">{title}</h2>
      )}

      <ul className="book-list">
        {books.map((book) => (
          <BookCard key={book.id} {...book} />
        ))}
      </ul>
    </section>
  );
};

export default BookList;
