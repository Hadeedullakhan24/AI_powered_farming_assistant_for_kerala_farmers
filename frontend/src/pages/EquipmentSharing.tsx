import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Check, MapPin, PackageOpen, Phone, Plus, Send, User, Wrench, X,
  Tag, Mail, MessageSquare, Info, ShieldCheck, CheckCircle2, Clock, PhoneCall
} from 'lucide-react'
import { PageTransition } from '../components/shared/PageTransition'
import { SkeletonGrid } from '../components/shared/SkeletonCard'
import { useAuth } from '../context/AuthContext'
import {
  browseEquipment, createEquipmentListing, getMyListings, getMyRequestsSent,
  requestEquipment, reviewEquipmentRequest, type EquipmentListing, type EquipmentRequest,
  type EquipmentType, type ListingIntent, type RequestPayload, type SentEquipmentRequest
} from '../api/equipment'

const types: EquipmentType[] = ['tiller', 'sprayer', 'harvester', 'water_pump', 'other']

const ago = (value: string) => {
  const m = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  return m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`
}

const statusStyle = (status: string) =>
  status === 'accepted' || status === 'available' ? 'badge-green' :
  status === 'rejected' || status === 'booked' ? 'badge-red' : 'badge-amber'

export const EquipmentSharing = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const client = useQueryClient()
  const [params, setParams] = useSearchParams()

  const [tab, setTab] = useState<'browse' | 'listings' | 'requests'>(
    params.get('tab') === 'listings' ? 'listings' :
    params.get('tab') === 'requests' ? 'requests' : 'browse'
  )

  const [type, setType] = useState<EquipmentType | ''>('')
  const [location, setLocation] = useState('')
  const [notice, setNotice] = useState('')
  const [requesting, setRequesting] = useState<EquipmentListing | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [glowing, setGlowing] = useState<Set<string>>(new Set())
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set())

  const [requestForm, setRequestForm] = useState<RequestPayload>({
    requester_name: user?.name || '',
    requester_address: '',
    requester_contact_number: '',
    message: '',
  })

  const [listingForm, setListingForm] = useState({
    equipment_name: '',
    equipment_type: 'tiller' as EquipmentType,
    listing_intent: 'rent' as ListingIntent,
    price_or_rate: '',
    description: '',
    location: '',
    contact_number: '',
  })

  const filters = useMemo(() => ({
    ...(type ? { equipment_type: type } : {}),
    ...(location ? { location } : {})
  }), [type, location])

  const browse = useQuery({
    queryKey: ['equipment', 'browse', filters],
    queryFn: () => browseEquipment(filters)
  })

  const listings = useQuery({
    queryKey: ['equipment', 'mine'],
    queryFn: getMyListings,
    enabled: tab === 'listings',
    refetchInterval: tab === 'listings' ? 9000 : false
  })

  const sent = useQuery({
    queryKey: ['equipment', 'sent'],
    queryFn: getMyRequestsSent,
    enabled: tab === 'requests',
    refetchInterval: tab === 'requests' ? 9000 : false
  })

  const priorRequests = useRef<Map<string, string> | null>(null)
  const priorSent = useRef<Map<string, string> | null>(null)

  useEffect(() => {
    setTab(
      params.get('tab') === 'listings' ? 'listings' :
      params.get('tab') === 'requests' ? 'requests' : 'browse'
    )
  }, [params])

  // Notifications on new incoming requests
  useEffect(() => {
    if (!listings.data) return
    const current = new Map<string, { request: EquipmentRequest; listing: EquipmentListing }>()
    listings.data.forEach(listing =>
      listing.requests.forEach(request =>
        current.set(request.request_id, { request, listing })
      )
    )
    if (priorRequests.current) {
      current.forEach(({ request, listing }, id) => {
        if (!priorRequests.current!.has(id) && request.status === 'pending') {
          setNotice(`🎉 New request from ${request.requester_name} for ${listing.equipment_name}! Check 'My Listings'.`)
          setGlowing(old => new Set(old).add(listing._id))
        }
      })
    }
    priorRequests.current = new Map([...current].map(([id, value]) => [id, value.request.status]))
  }, [listings.data])

  // Notifications on accepted/rejected requests sent by current user
  useEffect(() => {
    if (!sent.data) return
    const current = new Map(sent.data.map(item => [item.request.request_id, item]))
    if (priorSent.current) {
      current.forEach((item, id) => {
        const previous = priorSent.current!.get(id)
        if (previous === 'pending' && item.request.status !== 'pending') {
          setGlowing(old => new Set(old).add(item.request.request_id))
          if (item.request.status === 'accepted') {
            setNotice(`✅ ${item.listing.owner_name} accepted your request for ${item.listing.equipment_name}! Owner Contact: ${item.listing.contact_number}`)
          } else {
            setNotice(`ℹ️ ${item.listing.owner_name} declined the request for ${item.listing.equipment_name}.`)
          }
        }
      })
    }
    priorSent.current = new Map([...current].map(([id, item]) => [id, item.request.status]))
  }, [sent.data])

  const invalidate = () => client.invalidateQueries({ queryKey: ['equipment'] })

  const sendRequest = useMutation({
    mutationFn: requestEquipment,
    onSuccess: () => {
      if (requesting) setRequestedIds(ids => new Set(ids).add(requesting._id))
      setNotice(`✅ Request sent to ${requesting?.owner_name || 'owner'}. Check 'My Requests' tab for updates!`)
      setRequesting(null)
      client.invalidateQueries({ queryKey: ['equipment', 'sent'] })
    },
    onError: (error: any) => setNotice(`❌ ${error.message || 'Could not send request.'}`)
  })

  const review = useMutation({
    mutationFn: reviewEquipmentRequest,
    onMutate: async ({ listingId, requestId, action }) => {
      await client.cancelQueries({ queryKey: ['equipment', 'mine'] })
      const previous = client.getQueryData<EquipmentListing[]>(['equipment', 'mine'])
      client.setQueryData<EquipmentListing[]>(['equipment', 'mine'], data =>
        data?.map(listing =>
          listing._id !== listingId ? listing : {
            ...listing,
            availability_status: action === 'accept' ? 'booked' :
              listing.requests.filter(r => r.request_id !== requestId).every(r => r.status !== 'pending') ? 'available' : 'requested',
            requests: listing.requests.map(r =>
              r.request_id === requestId ? { ...r, status: action === 'accept' ? 'accepted' : 'rejected' } :
              action === 'accept' && r.status === 'pending' ? { ...r, status: 'rejected' } : r
            )
          }
        )
      )
      return { previous }
    },
    onError: (_error, _value, context) => {
      if (context?.previous) client.setQueryData(['equipment', 'mine'], context.previous)
      setNotice('Unable to update request status. Please try again.')
    },
    onSuccess: invalidate
  })

  const add = useMutation({
    mutationFn: createEquipmentListing,
    onSuccess: () => {
      setAddOpen(false)
      setNotice('🎉 Equipment listing created successfully!')
      invalidate()
      setTab('listings')
      setParams({ tab: 'listings' })
    }
  })

  const selectTab = (next: typeof tab) => {
    setTab(next)
    setParams(next === 'browse' ? {} : { tab: next })
  }

  const submitRequest = (event: FormEvent) => {
    event.preventDefault()
    if (!requesting || !requestForm.requester_name.trim() || !requestForm.requester_address.trim() || !/^\+?[0-9\s-]{7,25}$/.test(requestForm.requester_contact_number)) {
      return setNotice('Please complete your name, address, and a valid contact phone number.')
    }
    sendRequest.mutate({ id: requesting._id, data: requestForm })
  }

  const submitListing = (event: FormEvent) => {
    event.preventDefault()
    if (!listingForm.equipment_name || !listingForm.description || !listingForm.location || !/^\+?[0-9\s-]{7,25}$/.test(listingForm.contact_number)) {
      return setNotice('Please fill out all fields with a valid contact phone number.')
    }
    add.mutate(listingForm)
  }

  return (
    <PageTransition>
      <main className="page-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 24px 80px' }}>

        {/* Header Hero Banner */}
        <section className="card" style={{
          padding: '28px 32px', marginBottom: 24,
          background: 'linear-gradient(135deg, #1B5E20, #2E7D32)', color: '#fff'
        }}>
          <h1 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', color: '#fff', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            🚜 {t('equipment_title')}
          </h1>
          <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
            List your farm equipment for rent or sale, borrow tools from nearby Kerala farmers, and exchange direct contact details upon agreement!
          </p>
        </section>

        {/* Tab Navigation */}
        <div className="tab-bar" style={{ marginBottom: 20, width: 'fit-content' }}>
          {(['browse', 'listings', 'requests'] as const).map(item => (
            <button
              key={item}
              id={`equipment-tab-${item}`}
              className={`tab-item ${tab === item ? 'active' : ''}`}
              onClick={() => selectTab(item)}
            >
              {tab === item && (
                <motion.span
                  layoutId="equipment-tab"
                  style={{ position: 'absolute', inset: 0, borderRadius: 9, background: 'var(--color-primary)', zIndex: -1 }}
                />
              )}
              {item === 'browse' ? '🚜 Browse Marketplace' : item === 'listings' ? '📋 My Listings' : '📬 My Sent Requests'}
            </button>
          ))}
        </div>

        {/* Floating Notice Alert */}
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              onAnimationComplete={() => setTimeout(() => setNotice(''), 5000)}
              style={{
                padding: '14px 18px', marginBottom: 20, borderRadius: 12,
                background: '#E8F5E9', border: '1px solid #C8E6C9', color: '#1B5E20',
                fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 10
              }}
            >
              <Info size={18} color="#2E7D32" />
              <span>{notice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ TAB: BROWSE MARKETPLACE ══ */}
        {tab === 'browse' && (
          <>
            <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="form-select"
                value={type}
                onChange={e => setType(e.target.value as EquipmentType | '')}
                style={{ maxWidth: 230 }}
              >
                <option value="">{t('equipment_all_types')}</option>
                {types.map(x => (
                  <option key={x} value={x}>{t(`equipment_type_${x}`)}</option>
                ))}
              </select>

              <input
                className="form-input"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder={t('equipment_search_location')}
                style={{ flex: 1, minWidth: 200 }}
              />

              <button
                className="btn btn-primary"
                onClick={() => setAddOpen(true)}
                style={{ display: 'inline-flex', gap: 8, padding: '10px 18px', whiteSpace: 'nowrap' }}
              >
                <Plus size={17} /> List Equipment
              </button>
            </div>

            <ListingGrid
              loading={browse.isLoading}
              listings={browse.data}
              currentUserId={user?.id}
              requestedIds={requestedIds}
              onRequest={listing => {
                setRequestForm(x => ({ ...x, requester_name: user?.name || x.requester_name }))
                setRequesting(listing)
              }}
            />
          </>
        )}

        {/* ══ TAB: MY LISTINGS & INCOMING REQUESTS ══ */}
        {tab === 'listings' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem' }}>
                Your Listed Farm Equipment ({listings.data?.length || 0})
              </h2>
              <button
                className="btn btn-primary"
                onClick={() => setAddOpen(true)}
                style={{ display: 'inline-flex', gap: 8 }}
              >
                <Plus size={17} /> Add New Listing
              </button>
            </div>

            {listings.isLoading ? (
              <SkeletonGrid />
            ) : listings.data?.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {listings.data.map(listing => (
                  <OwnerCard
                    key={listing._id}
                    listing={listing}
                    glowing={glowing.has(listing._id)}
                    review={review.mutate}
                  />
                ))}
              </div>
            ) : (
              <Empty message="You haven't listed any equipment yet. Click 'Add New Listing' to start!" />
            )}
          </>
        )}

        {/* ══ TAB: MY SENT REQUESTS & BORROWED ══ */}
        {tab === 'requests' && (
          <>
            <h2 style={{ margin: '0 0 20px', fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem' }}>
              Equipment Requests Sent ({sent.data?.length || 0})
            </h2>
            {sent.isLoading ? (
              <SkeletonGrid />
            ) : sent.data?.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {sent.data.map(item => (
                  <SentCard
                    key={item.request.request_id}
                    item={item}
                    glowing={glowing.has(item.request.request_id)}
                  />
                ))}
              </div>
            ) : (
              <Empty message="You haven't requested any equipment yet. Browse the marketplace and send a request!" />
            )}
          </>
        )}

        {/* Request Modal */}
        <RequestModal
          listing={requesting}
          form={requestForm}
          setForm={setRequestForm}
          onClose={() => setRequesting(null)}
          onSubmit={submitRequest}
          pending={sendRequest.isPending}
        />

        {/* New Listing Modal */}
        <ListingModal
          open={addOpen}
          form={listingForm}
          setForm={setListingForm}
          onClose={() => setAddOpen(false)}
          onSubmit={submitListing}
          pending={add.isPending}
        />

      </main>
    </PageTransition>
  )
}

// ── Component: Listing Grid (Browse) ──────────────────────────────────────────

const ListingGrid = ({
  loading, listings, currentUserId, requestedIds, onRequest
}: {
  loading: boolean
  listings?: EquipmentListing[]
  currentUserId?: string
  requestedIds: Set<string>
  onRequest: (listing: EquipmentListing) => void
}) => {
  if (loading) return <SkeletonGrid />
  if (!listings?.length) return <Empty message="No equipment available matching your criteria." />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 20 }}>
      {listings.map(listing => {
        const isMine = currentUserId && listing.owner_id === currentUserId
        const requested = requestedIds.has(listing._id)
        const isSale = listing.listing_intent === 'sale'

        return (
          <article className="card card-hover" key={listing._id} style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
              <span className={`badge ${isSale ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.72rem' }}>
                {isSale ? '🏷️ For Sale' : '🔄 For Rent / Borrow'}
              </span>
              <span className="badge badge-green" style={{ fontSize: '0.72rem' }}>
                Available
              </span>
            </div>

            <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', margin: '0 0 6px', fontWeight: 700 }}>
              {listing.equipment_name}
            </h3>

            {listing.price_or_rate && (
              <p style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                💰 {listing.price_or_rate}
              </p>
            )}

            <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5, flex: 1 }}>
              {listing.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={14} color="var(--color-primary)" /> {listing.location}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} color="var(--color-primary)" /> Owner: <strong>{listing.owner_name}</strong>
              </span>
            </div>

            {isMine ? (
              <button className="btn btn-secondary" disabled style={{ width: '100%', opacity: 0.7 }}>
                👤 Your Listing
              </button>
            ) : (
              <button
                className="btn btn-primary"
                disabled={requested}
                style={{ width: '100%', opacity: requested ? 0.6 : 1 }}
                onClick={() => onRequest(listing)}
              >
                {requested ? 'Request Sent' : isSale ? '🛒 Request to Buy' : '🔄 Request to Borrow'}
              </button>
            )}
          </article>
        )
      })}
    </div>
  )
}

// ── Component: Owner Card (My Listings & Received Requests) ───────────────────

const OwnerCard = ({
  listing, glowing, review
}: {
  listing: EquipmentListing
  glowing: boolean
  review: (input: { listingId: string; requestId: string; action: 'accept' | 'reject' }) => void
}) => {
  const [open, setOpen] = useState(false)
  const pendingRequests = listing.requests.filter(r => r.status === 'pending')
  const acceptedRequests = listing.requests.filter(r => r.status === 'accepted')
  const isSale = listing.listing_intent === 'sale'

  return (
    <motion.article
      animate={glowing ? { boxShadow: ['0 2px 16px rgba(27,94,32,.08)', '0 0 0 5px rgba(67,160,71,.35)', '0 2px 16px rgba(27,94,32,.08)'] } : {}}
      className="card"
      style={{ padding: 22, display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className={`badge ${isSale ? 'badge-blue' : 'badge-green'}`}>
          {isSale ? '🏷️ For Sale' : '🔄 For Rent'}
        </span>
        <span className={`badge ${statusStyle(listing.availability_status)}`}>
          {listing.availability_status}
        </span>
      </div>

      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', margin: '0 0 4px', fontWeight: 700 }}>
        {listing.equipment_name}
      </h3>
      {listing.price_or_rate && (
        <p style={{ margin: '0 0 8px', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.9rem' }}>
          💰 {listing.price_or_rate}
        </p>
      )}
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.82rem', marginBottom: 14 }}>
        📍 {listing.location}
      </p>

      <button
        className="btn btn-secondary"
        onClick={() => setOpen(!open)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>Incoming Requests ({listing.requests.length})</span>
        {pendingRequests.length > 0 && (
          <span style={{
            background: '#E65100', color: '#fff', fontSize: '0.72rem',
            padding: '2px 8px', borderRadius: 99, fontWeight: 700
          }}>
            {pendingRequests.length} Pending
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginTop: 14 }}
          >
            {listing.requests.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', textAlign: 'center', margin: '10px 0' }}>
                No requests received for this listing yet.
              </p>
            ) : (
              listing.requests.map(request => (
                <div
                  key={request.request_id}
                  style={{
                    padding: 14, borderRadius: 12, marginBottom: 10,
                    background: request.status === 'accepted' ? '#E8F5E9' : request.status === 'rejected' ? '#F5F5F5' : '#FFF8E1',
                    border: `1px solid ${request.status === 'accepted' ? '#C8E6C9' : request.status === 'rejected' ? '#E0E0E0' : '#FFE082'}`,
                    opacity: request.status === 'rejected' ? 0.75 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <strong style={{ fontSize: '0.9rem', color: '#1B5E20' }}>{request.requester_name}</strong>
                    <span className={`badge ${statusStyle(request.status)}`} style={{ fontSize: '0.7rem' }}>
                      {request.status}
                    </span>
                  </div>

                  {/* Mutual Details Exchange for Owner */}
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Phone size={13} color="var(--color-primary)" />
                      <a href={`tel:${request.requester_contact_number}`} style={{ fontWeight: 700, color: 'var(--color-primary)', textDecoration: 'none' }}>
                        {request.requester_contact_number}
                      </a>
                    </div>
                    {request.requester_email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Mail size={13} color="var(--color-primary)" />
                        <span>{request.requester_email}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={13} color="var(--color-primary)" />
                      <span>{request.requester_address}</span>
                    </div>
                    {request.message && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontStyle: 'italic', marginTop: 2 }}>
                        <MessageSquare size={13} color="var(--color-primary)" style={{ marginTop: 2 }} />
                        <span>"{request.message}"</span>
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                      Requested {ago(request.requested_at)}
                    </div>
                  </div>

                  {/* Review Actions */}
                  {request.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button
                        className="btn btn-primary"
                        style={{ flex: 1, padding: '7px 12px', fontSize: '0.8rem', justifyContent: 'center' }}
                        onClick={() => review({ listingId: listing._id, requestId: request.request_id, action: 'accept' })}
                      >
                        <Check size={14} /> Accept & Exchange Details
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '7px 12px', fontSize: '0.8rem', justifyContent: 'center' }}
                        onClick={() => review({ listingId: listing._id, requestId: request.request_id, action: 'reject' })}
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {request.status === 'accepted' && (
                    <div style={{ marginTop: 10, padding: 8, background: '#C8E6C9', borderRadius: 8, fontSize: '0.78rem', color: '#1B5E20', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={15} />
                      Connected! Contact {request.requester_name} at {request.requester_contact_number} for pickup.
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

// ── Component: Sent Card (Borrower/Buyer Requests Sent) ─────────────────────────

const SentCard = ({ item, glowing }: { item: SentEquipmentRequest; glowing: boolean }) => {
  const isAccepted = item.request.status === 'accepted'
  const isRejected = item.request.status === 'rejected'
  const isSale = item.listing.listing_intent === 'sale'

  return (
    <motion.article
      animate={glowing ? { scale: [1, 1.02, 1] } : {}}
      className="card"
      style={{ padding: 22, border: isAccepted ? '2px solid #2E7D32' : undefined }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className={`badge ${isSale ? 'badge-blue' : 'badge-green'}`} style={{ fontSize: '0.72rem' }}>
          {isSale ? '🛒 Purchase Request' : '🔄 Borrow Request'}
        </span>
        <span className={`badge ${statusStyle(item.request.status)}`}>
          {item.request.status}
        </span>
      </div>

      <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '1.1rem', margin: '0 0 6px', fontWeight: 700 }}>
        {item.listing.equipment_name}
      </h3>

      <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
        Owner: <strong>{item.listing.owner_name}</strong>
      </p>

      {/* Accepted Owner Contact Card — Mutual Details Exchange */}
      {isAccepted && item.listing.contact_number && (
        <div style={{
          padding: 16, background: '#E8F5E9', border: '1px solid #C8E6C9',
          borderRadius: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#1B5E20', fontWeight: 700, fontSize: '0.88rem' }}>
            <CheckCircle2 size={18} color="#2E7D32" />
            Request Accepted by Owner!
          </div>

          <div style={{ fontSize: '0.82rem', color: '#2E7D32', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} /> Owner: <strong>{item.listing.owner_name}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Phone size={14} /> Contact Phone: <strong style={{ fontSize: '0.9rem' }}>{item.listing.contact_number}</strong>
            </div>
            {item.listing.owner_email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mail size={14} /> Email: <strong>{item.listing.owner_email}</strong>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} /> Pickup Location: <strong>{item.listing.location}</strong>
            </div>
          </div>

          <a
            href={`tel:${item.listing.contact_number}`}
            className="btn btn-primary"
            style={{
              textDecoration: 'none', justifyContent: 'center',
              marginTop: 4, padding: '9px 16px', fontSize: '0.85rem'
            }}
          >
            <PhoneCall size={15} /> Call Owner ({item.listing.owner_name})
          </a>
        </div>
      )}

      {isRejected && (
        <p style={{ fontSize: '0.82rem', color: '#C62828', fontStyle: 'italic', margin: '0 0 10px' }}>
          Owner was unable to lend this equipment right now.
        </p>
      )}

      {!isAccepted && !isRejected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#E65100', marginBottom: 10 }}>
          <Clock size={14} />
          Awaiting response from {item.listing.owner_name}...
        </div>
      )}

      <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem' }}>
        Requested {ago(item.request.requested_at)}
      </small>
    </motion.article>
  )
}

// ── Component: Empty State ───────────────────────────────────────────────────

const Empty = ({ message }: { message: string }) => (
  <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-secondary)' }}>
    <PackageOpen size={48} color="var(--color-text-secondary)" style={{ marginBottom: 12 }} />
    <p style={{ margin: 0, fontSize: '0.95rem' }}>{message}</p>
  </div>
)

// ── Modal: Send Request to Borrow / Purchase ──────────────────────────────────

const RequestModal = ({
  listing, form, setForm, onClose, onSubmit, pending
}: {
  listing: EquipmentListing | null
  form: RequestPayload
  setForm: React.Dispatch<React.SetStateAction<RequestPayload>>
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  pending: boolean
}) => {
  const isSale = listing?.listing_intent === 'sale'

  return (
    <Modal
      open={!!listing}
      title={isSale ? `Request to Buy: ${listing?.equipment_name || ''}` : `Request to Borrow: ${listing?.equipment_name || ''}`}
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 16, padding: 12, background: '#E8F5E9', borderRadius: 10, fontSize: '0.82rem', color: '#1B5E20' }}>
          💡 When the owner accepts your request, your contact details will be shared with them, and you will receive the owner's phone number!
        </div>

        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: '0.85rem' }}>
          Your Full Name *
          <input
            className="form-input"
            value={form.requester_name}
            onChange={e => setForm({ ...form, requester_name: e.target.value })}
            required
            placeholder="e.g. Ramesh Kumar"
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: '0.85rem' }}>
          Your Phone / Mobile Number *
          <input
            className="form-input"
            value={form.requester_contact_number}
            onChange={e => setForm({ ...form, requester_contact_number: e.target.value })}
            required
            placeholder="e.g. +91 98765 43210"
          />
        </label>

        <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: '0.85rem' }}>
          Your Location / Address *
          <input
            className="form-input"
            value={form.requester_address}
            onChange={e => setForm({ ...form, requester_address: e.target.value })}
            required
            placeholder="e.g. Alathur Panchayat, Palakkad"
          />
        </label>

        <label style={{ display: 'block', marginBottom: 16, fontWeight: 600, fontSize: '0.85rem' }}>
          Message to Owner (Optional)
          <textarea
            className="form-input"
            rows={3}
            value={form.message || ''}
            onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder={isSale ? "Specify your purchase offer or questions..." : "Specify duration needed (e.g. 2 days for paddy harvest)..."}
          />
        </label>

        <button
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
          disabled={pending}
        >
          <Send size={15} /> {pending ? 'Sending...' : isSale ? 'Send Purchase Request' : 'Send Borrow Request'}
        </button>
      </form>
    </Modal>
  )
}

// ── Modal: Add New Equipment Listing ─────────────────────────────────────────

const ListingModal = ({
  open, form, setForm, onClose, onSubmit, pending
}: {
  open: boolean
  form: {
    equipment_name: string
    equipment_type: EquipmentType
    listing_intent: ListingIntent
    price_or_rate: string
    description: string
    location: string
    contact_number: string
  }
  setForm: React.Dispatch<React.SetStateAction<{
    equipment_name: string
    equipment_type: EquipmentType
    listing_intent: ListingIntent
    price_or_rate: string
    description: string
    location: string
    contact_number: string
  }>>
  onClose: () => void
  onSubmit: (event: FormEvent) => void
  pending: boolean
}) => (
  <Modal open={open} title="Add New Farm Equipment Listing" onClose={onClose}>
    <form onSubmit={onSubmit}>

      {/* Listing Purpose: Rent vs Sale */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: '0.85rem' }}>
          Listing Purpose *
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button
            type="button"
            className={`btn ${form.listing_intent === 'rent' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setForm({ ...form, listing_intent: 'rent' })}
            style={{ padding: '8px', fontSize: '0.85rem', justifyContent: 'center' }}
          >
            🔄 For Rent / Borrow
          </button>
          <button
            type="button"
            className={`btn ${form.listing_intent === 'sale' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setForm({ ...form, listing_intent: 'sale' })}
            style={{ padding: '8px', fontSize: '0.85rem', justifyContent: 'center' }}
          >
            🏷️ For Sale / Purchase
          </button>
        </div>
      </div>

      <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: '0.85rem' }}>
        Equipment Name *
        <input
          className="form-input"
          value={form.equipment_name}
          onChange={e => setForm({ ...form, equipment_name: e.target.value })}
          required
          placeholder="e.g. Kubota Power Tiller / STIHL Mist Blower Sprayer"
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
          Equipment Type *
          <select
            className="form-select"
            value={form.equipment_type}
            onChange={e => setForm({ ...form, equipment_type: e.target.value as EquipmentType })}
          >
            {types.map(t => (
              <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </label>

        <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>
          {form.listing_intent === 'sale' ? 'Sale Price (Optional)' : 'Rental Rate (Optional)'}
          <input
            className="form-input"
            value={form.price_or_rate}
            onChange={e => setForm({ ...form, price_or_rate: e.target.value })}
            placeholder={form.listing_intent === 'sale' ? 'e.g. ₹25,000' : 'e.g. ₹500 / day (or Free)'}
          />
        </label>
      </div>

      <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: '0.85rem' }}>
        Description & Condition *
        <textarea
          className="form-input"
          rows={3}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          required
          placeholder="e.g. 14HP diesel tiller in excellent condition with attachments. Available for immediate farm work."
        />
      </label>

      <label style={{ display: 'block', marginBottom: 12, fontWeight: 600, fontSize: '0.85rem' }}>
        Location (Panchayat / District) *
        <input
          className="form-input"
          value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          required
          placeholder="e.g. Chittur, Palakkad District"
        />
      </label>

      <label style={{ display: 'block', marginBottom: 16, fontWeight: 600, fontSize: '0.85rem' }}>
        Your Contact Phone Number *
        <input
          className="form-input"
          value={form.contact_number}
          onChange={e => setForm({ ...form, contact_number: e.target.value })}
          required
          placeholder="e.g. +91 94000 12345"
        />
      </label>

      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}
        disabled={pending}
      >
        {pending ? 'Publishing...' : 'Publish Listing to Marketplace'}
      </button>
    </form>
  </Modal>
)

// ── Generic Reusable Modal Container ──────────────────────────────────────────

const Modal = ({
  open, title, children, onClose
}: {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 500, display: 'grid',
          placeItems: 'center', padding: 16, background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(3px)'
        }}
      >
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          exit={{ y: 20 }}
          onClick={event => event.stopPropagation()}
          className="card"
          style={{ width: 'min(520px, 100%)', padding: 26, maxHeight: '90vh', overflowY: 'auto' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontFamily: 'Poppins, sans-serif', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              style={{ border: 0, background: 'none', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)
