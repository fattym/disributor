import { ShelfUnitRenderer } from './3d/ShelfUnit';
import { ShelfUnitLayout } from './3d/ShelfUnit';

interface Props {
  shelfUnits: ShelfUnitLayout[];
}

export function Shelves({ shelfUnits }: Props) {
  return (
    <>
      {shelfUnits.map((unit, i) => (
        <ShelfUnitRenderer
          key={i}
          products={unit.products}
          centerX={unit.centerX}
          z={unit.origin[2]}
          facingZ={unit.facingZ}
          departmentName={unit.departmentName}
          departmentColor={unit.departmentColor}
        />
      ))}
    </>
  );
}
