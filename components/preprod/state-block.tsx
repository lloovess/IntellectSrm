type StateBlockProps = {
  type: 'loading' | 'empty' | 'error';
  text: string;
  colSpan?: number;
};

export default function StateBlock({ type, text, colSpan = 1 }: StateBlockProps) {
  return (
    <tr>
      <td colSpan={colSpan} className={`pp-state ${type}`}>
        {text}
      </td>
    </tr>
  );
}
