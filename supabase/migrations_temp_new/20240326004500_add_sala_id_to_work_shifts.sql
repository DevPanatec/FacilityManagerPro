-- Agregar la columna sala_id a la tabla work_shifts
ALTER TABLE public.work_shifts
ADD COLUMN IF NOT EXISTS sala_id UUID REFERENCES public.salas(id);

-- Habilitar RLS
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS
CREATE POLICY "Users can view their organization's work shifts"
ON public.work_shifts
FOR SELECT
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert their organization's work shifts"
ON public.work_shifts
FOR INSERT
WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization's work shifts"
ON public.work_shifts
FOR UPDATE
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()))
WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their organization's work shifts"
ON public.work_shifts
FOR DELETE
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())); 