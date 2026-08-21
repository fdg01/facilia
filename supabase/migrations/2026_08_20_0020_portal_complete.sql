-- Plan 05: Portal completo — tablas nuevas con RLS
-- requests, request_events, communications, evidence_visibility, service_events

CREATE TABLE public.requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  type text NOT NULL CHECK (type IN ('extra_service', 'inquiry', 'complaint')),
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid REFERENCES public.users(id),
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_requests_organization ON public.requests(organization_id);
CREATE INDEX idx_requests_status ON public.requests(status);
CREATE INDEX idx_requests_created_by ON public.requests(created_by);

ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client sees own organization requests"
  ON public.requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'client'
        AND u.status = 'active'
        AND u.organization_id = requests.organization_id
    )
  );

CREATE POLICY "admin sees all requests"
  ON public.requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.status = 'active'
    )
  );

CREATE POLICY "client creates own organization requests"
  ON public.requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'client'
        AND u.status = 'active'
        AND u.organization_id = requests.organization_id
        AND u.id = requests.created_by
    )
  );

CREATE POLICY "admin manages requests"
  ON public.requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.status = 'active'
    )
  );

CREATE TABLE public.request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('created', 'comment', 'status_change', 'assigned', 'resolved')),
  author uuid REFERENCES public.users(id),
  content text,
  previous_status text,
  new_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_request_events_request ON public.request_events(request_id);

ALTER TABLE public.request_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client sees events of own organization requests"
  ON public.request_events FOR SELECT
  USING (
    request_id IN (
      SELECT r.id FROM public.requests r
      WHERE EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'client'
          AND u.status = 'active'
          AND u.organization_id = r.organization_id
      )
    )
  );

CREATE POLICY "admin sees all request events"
  ON public.request_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.status = 'active'
    )
  );

CREATE POLICY "admin inserts request events"
  ON public.request_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.status = 'active'
    )
    OR (
      -- allow system/client to insert 'created' event when creating a request
      EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = auth.uid()
          AND u.role = 'client'
          AND u.status = 'active'
      )
    )
  );

CREATE TABLE public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  sent_by uuid REFERENCES public.users(id),
  subject text NOT NULL,
  body text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'visit_scheduled', 'service_completed', 'incident', 'payment', 'custom')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX idx_communications_organization ON public.communications(organization_id);
CREATE INDEX idx_communications_read ON public.communications(read);

ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client sees own organization communications"
  ON public.communications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'client'
        AND u.status = 'active'
        AND u.organization_id = communications.organization_id
    )
  );

CREATE POLICY "admin sees all communications"
  ON public.communications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.status = 'active'
    )
  );

CREATE POLICY "admin inserts communications"
  ON public.communications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.status = 'active'
    )
  );

CREATE POLICY "client marks communication as read"
  ON public.communications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'client'
        AND u.status = 'active'
        AND u.organization_id = communications.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'client'
        AND u.status = 'active'
        AND u.organization_id = communications.organization_id
    )
  );

CREATE TABLE public.evidence_visibility (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id uuid NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  authorized_by uuid NOT NULL REFERENCES public.users(id),
  authorized_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(evidence_id, organization_id)
);

CREATE INDEX idx_evidence_visibility_evidence ON public.evidence_visibility(evidence_id);
CREATE INDEX idx_evidence_visibility_organization ON public.evidence_visibility(organization_id);

ALTER TABLE public.evidence_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client sees authorized evidence visibility"
  ON public.evidence_visibility FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'client'
        AND u.status = 'active'
        AND u.organization_id = evidence_visibility.organization_id
    )
  );

CREATE POLICY "admin manages evidence visibility"
  ON public.evidence_visibility FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.status = 'active'
    )
  );

CREATE TABLE public.service_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  work_order_id uuid REFERENCES public.work_orders(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('visit_completed', 'product_delivered', 'incident_reported', 'service_started', 'service_paused', 'service_resumed', 'evidence_added')),
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_events_organization ON public.service_events(organization_id);
CREATE INDEX idx_service_events_work_order ON public.service_events(work_order_id);
CREATE INDEX idx_service_events_created_at ON public.service_events(created_at);

ALTER TABLE public.service_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client sees own organization service events"
  ON public.service_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'client'
        AND u.status = 'active'
        AND u.organization_id = service_events.organization_id
    )
  );

CREATE POLICY "admin sees all service events"
  ON public.service_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.status = 'active'
    )
  );

CREATE POLICY "admin inserts service events"
  ON public.service_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.status = 'active'
    )
  );
