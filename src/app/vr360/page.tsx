"use client";

import { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import "./vr360.css";

const NIGHTS = [
  { d: new Date("2026-05-30T20:30:00+07:00"), n: "Đêm Khai mạc — 30/5" },
  { d: new Date("2026-06-06T20:30:00+07:00"), n: "Vòng loại 1 — 06/6" },
  { d: new Date("2026-06-13T20:30:00+07:00"), n: "Vòng loại 2 — 13/6" },
  { d: new Date("2026-06-20T20:30:00+07:00"), n: "Vòng loại 3 — 20/6" },
  { d: new Date("2026-06-27T20:30:00+07:00"), n: "Vòng loại 4 — 27/6" },
  { d: new Date("2026-07-11T20:30:00+07:00"), n: "★ Đêm Chung kết — 11/7" },
];

const NIGHT_TILES = [
  { dateStr: "30/5", name: "Khai mạc · Thiên nhiên", date: new Date("2026-05-30T00:00:00+07:00") },
  { dateStr: "06/6", name: "Vòng loại 1", date: new Date("2026-06-06T00:00:00+07:00") },
  { dateStr: "13/6", name: "Vòng loại 2", date: new Date("2026-06-13T00:00:00+07:00") },
  { dateStr: "20/6", name: "Vòng loại 3", date: new Date("2026-06-20T00:00:00+07:00") },
  { dateStr: "27/6", name: "Vòng loại 4", date: new Date("2026-06-27T00:00:00+07:00") },
  { dateStr: "11/7 ★", name: "Chung kết", date: new Date("2026-07-11T00:00:00+07:00"), isHot: true },
];

const stampData = [
  { emoji: "🏛️", label: "Gem #1", title: "Phòng Truyền Thống CATP" },
  { emoji: "🏺", label: "Gem #2", title: "Di tích Cẩm Lệ" },
  { emoji: "🌊", label: "Gem #3", title: "The Pearl Hội An" },
  { emoji: "⚔️", label: "Gem #4", title: "Di tích Bàn Thạch" },
  { emoji: "⛰️", label: "Gem #5", title: "Di tích Hải Vân" },
];

// ── Gem slideshow images (replace URLs with real photos)
const GEM_SLIDES = [
  [
    { src: "/gems/catp-1.png", alt: "Hiện vật trưng bày - Phòng Truyền Thống CATP" },
    { src: "/gems/catp-2.png", alt: "Không gian phòng truyền thống" },
    { src: "/gems/catp-3.png", alt: "Tài liệu lịch sử lực lượng vũ trang" },
  ],
  [
    { src: "/gems/camle-1.png", alt: "Di chỉ khảo cổ Chăm Phong Lệ" },
    { src: "/gems/camle-2.png", alt: "Nền móng tháp Chăm thế kỷ XI" },
    { src: "/gems/camle-3.png", alt: "Hiện vật khai quật Cẩm Lệ" },
  ],
  [
    { src: "/gems/pearl-1.png", alt: "The Pearl Hội An ven sông Thu Bồn" },
    { src: "/gems/pearl-2.png", alt: "Không gian resort boutique Hội An" },
    { src: "/gems/pearl-3.png", alt: "Hoàng hôn trên sông Thu Bồn" },
  ],
  [
    { src: "/gems/banthach-1.png", alt: "Di tích lịch sử phường Bàn Thạch" },
    { src: "/gems/banthach-2.png", alt: "Kháng chiến miền Trung" },
    { src: "/gems/banthach-3.png", alt: "Di tích cách mạng Quảng Nam" },
  ],
  [
    { src: "/gems/haivanquan-1.png", alt: "Hải Vân Quan nhìn từ trên cao" },
    { src: "/gems/haivanquan-2.png", alt: "Lô cốt Pháp trên đỉnh đèo Hải Vân" },
    { src: "/gems/haivanquan-3.png", alt: "Panorama Biển Đông từ Hải Vân" },
  ],
];

// ── Industry tab data
const SOLUTION_TABS = [
  {
    id: "chinh-phu",
    label: "Chính phủ số",
    emoji: "🏛️",
    headline: "Chuyển đổi số toàn diện cho cơ quan nhà nước",
    desc: "MobiFone cung cấp nền tảng số hóa vận hành hành chính, tăng hiệu quả phục vụ người dân, đảm bảo an toàn thông tin cho các Sở/Ban/Ngành tại Đà Nẵng.",
    color: "#0055a5",
    gradient: "linear-gradient(135deg,#003d82,#0077cc)",
    products: [
      { icon: "📄", name: "Chỉnh lý & Số hóa tài liệu", desc: "Số hóa hồ sơ lưu trữ theo chuẩn ISO 15489, tìm kiếm & tra cứu tức thì", tag: "Cơ quan nhà nước" },
      { icon: "📹", name: "Camera AI giám sát", desc: "Nhận diện khuôn mặt, phân tích hành vi, giám sát an ninh 24/7", tag: "Smart City" },
      { icon: "🖥️", name: "Kiosk tiếp dân thông minh", desc: "Tra cứu, nộp hồ sơ tự động, giảm tải cho cán bộ công chức", tag: "Dịch vụ công" },
      { icon: "📢", name: "Truyền thanh thông minh", desc: "Loa phát thanh 4G/IP tích hợp AI Text-to-Speech, phủ sóng toàn thành phố", tag: "Phát thanh số" },
      { icon: "📝", name: "eOffice · Quản lý văn bản", desc: "Ký số PKI, luân chuyển văn bản nội bộ, xử lý mọi lúc mọi nơi", tag: "Văn phòng số" },
      { icon: "📋", name: "eContract · Hợp đồng điện tử", desc: "Ký kết hợp đồng trên môi trường số, đáp ứng pháp lý hiện hành", tag: "Pháp lý số" },
      { icon: "🤝", name: "MobiFone Meet", desc: "Họp trực tuyến bảo mật, không giới hạn người dùng, lưu trữ nội địa", tag: "Hội nghị số" },
      { icon: "🗂️", name: "MobiFone HRM", desc: "Quản lý nhân sự, chấm công, lương thưởng tự động cho đơn vị hành chính", tag: "Nhân sự số" },
    ],
  },
  {
    id: "ha-tang",
    label: "Hạ tầng số",
    emoji: "☁️",
    headline: "Cloud — Data Center — Kết nối riêng tư chuẩn doanh nghiệp",
    desc: "Hạ tầng Cloud và Data Center của MobiFone đạt chuẩn quốc tế TIER 3, SLA 99.95%, sẵn sàng phục vụ từ startup đến tập đoàn lớn.",
    color: "#0077cc",
    gradient: "linear-gradient(135deg,#0077cc,#00aaee)",
    products: [
      { icon: "🖥️", name: "MobiFone Cloud IaaS", desc: "Máy chủ ảo linh hoạt, CPU Intel Xeon Gold, thanh toán Pay-as-you-go", tag: "Cloud" },
      { icon: "🏢", name: "Co-location Data Center", desc: "Thuê chỗ đặt thiết bị tại DC chuẩn TIER 3, 3 miền, bảo mật ISO 27001", tag: "DC" },
      { icon: "🔒", name: "Virtual Private Cloud", desc: "Mạng riêng ảo trên hạ tầng MobiFone, kiểm soát toàn quyền", tag: "VPC" },
      { icon: "⚖️", name: "Load Balancer · Kubernetes", desc: "Cân bằng tải và nền tảng container hoá cho ứng dụng hiện đại", tag: "DevOps" },
      { icon: "📦", name: "Lưu trữ đám mây mobiCloud", desc: "Block, Object, File — linh hoạt theo nhu cầu doanh nghiệp", tag: "Storage" },
      { icon: "🌐", name: "Leased Line · IPLC Quốc tế", desc: "Đường truyền riêng tốc độ cao trong nước & quốc tế, SLA 99.9%", tag: "Network" },
      { icon: "🔧", name: "Vận hành & Quản lý Cloud", desc: "Dịch vụ managed cloud, monitoring 24/7, tối ưu chi phí liên tục", tag: "Managed" },
      { icon: "🛰️", name: "Private Network 5G/4G", desc: "Mạng di động riêng cho khu công nghiệp, sự kiện lớn, toà nhà thông minh", tag: "5G" },
    ],
  },
  {
    id: "an-toan",
    label: "An toàn mạng",
    emoji: "🛡️",
    headline: "Bảo vệ toàn diện từ lớp ứng dụng đến hạ tầng",
    desc: "MobiFone cung cấp dịch vụ đánh giá, giám sát và bảo vệ an toàn thông tin cho cơ quan nhà nước và doanh nghiệp tại Đà Nẵng.",
    color: "#0a5a3a",
    gradient: "linear-gradient(135deg,#0a5a3a,#1a9a6a)",
    products: [
      { icon: "🔍", name: "Đánh giá ATTT theo cấp độ", desc: "Kiểm tra hệ thống thông tin theo TT17/2014 và NĐCP 13/2023", tag: "Compliance" },
      { icon: "👁️", name: "SOC Giám sát 24/7", desc: "Trung tâm điều hành an ninh mạng, phát hiện & xử lý sự cố realtime", tag: "SOC" },
      { icon: "🔥", name: "Tường lửa WAF · OWAF", desc: "Bảo vệ ứng dụng web khỏi SQL Injection, XSS, DDoS tích hợp AI", tag: "WAF" },
      { icon: "🦠", name: "Antivirus Cloud", desc: "Phát hiện và loại bỏ virus, ransomware, spyware tự động", tag: "AV" },
      { icon: "⚔️", name: "Pentest · Red Team", desc: "Kiểm thử xâm nhập thực chiến, giả lập tấn công phát hiện lỗ hổng", tag: "Pentest" },
      { icon: "🔐", name: "MobiSafe · Internet an toàn", desc: "Bảo vệ người dùng cuối, chống lừa đảo, bảo vệ trẻ em trực tuyến", tag: "EndPoint" },
      { icon: "📊", name: "Diễn tập an toàn thông tin", desc: "Tổ chức kịch bản diễn tập tấn công mạng thực tế cho đơn vị", tag: "Drill" },
      { icon: "📡", name: "Chống DDoS tầng 7", desc: "Lớp bảo vệ Firewall 7 tầng, lọc lưu lượng độc hại tự động", tag: "DDoS" },
    ],
  },
  {
    id: "kinh-te",
    label: "Kinh tế số",
    emoji: "💳",
    headline: "Hệ sinh thái tài chính số & quản trị doanh nghiệp",
    desc: "Bộ sản phẩm hỗ trợ SME chuyển đổi số toàn diện — từ thanh toán, hóa đơn đến ký số và quản lý vận hành.",
    color: "#7a3a00",
    gradient: "linear-gradient(135deg,#7a3a00,#cc7700)",
    products: [
      { icon: "💸", name: "MobiFone Money", desc: "Ví điện tử, thanh toán QR, chuyển tiền và tích hợp dịch vụ tài chính số", tag: "Fintech" },
      { icon: "🔑", name: "MobiFone CA · Chữ ký số", desc: "Chứng thực chữ ký số công cộng được Bộ TT&TT cấp phép", tag: "PKI" },
      { icon: "🧾", name: "Hóa đơn điện tử Invoice", desc: "Phát hành & quản lý hóa đơn điện tử theo NĐ 123, dưới 1 giây", tag: "e-Invoice" },
      { icon: "🛒", name: "1POS · Quản lý bán hàng", desc: "Phần mềm bán hàng đa kênh, quản lý kho, tích hợp thanh toán", tag: "POS" },
      { icon: "📑", name: "eContract · Hợp đồng số", desc: "Ký kết hợp đồng hợp pháp, hỗ trợ eKYC, đa nền tảng", tag: "Contract" },
      { icon: "📊", name: "Kế toán số MobiFone", desc: "Phần mềm kế toán tích hợp, báo cáo tài chính tự động", tag: "Accounting" },
      { icon: "🏥", name: "Bảo hiểm mBH", desc: "Quản lý bảo hiểm xã hội điện tử, khai báo tự động cho doanh nghiệp", tag: "Insurance" },
      { icon: "📱", name: "MobiFone IMS", desc: "Phần mềm quản lý hóa đơn điện tử dành cho kế toán và doanh nghiệp", tag: "IMS" },
    ],
  },
  {
    id: "xa-hoi",
    label: "Xã hội số",
    emoji: "🌐",
    headline: "Giáo dục · Y tế · Du lịch nâng tầm chất lượng sống",
    desc: "Từ lớp học STEM đến hồ sơ sức khỏe, từ VR360 du lịch đến IoT quản lý đô thị — MobiFone kiến tạo xã hội số cho người dân Đà Nẵng.",
    color: "#004d4d",
    gradient: "linear-gradient(135deg,#004d4d,#00a080)",
    products: [
      { icon: "🎓", name: "Giáo dục số mobiEdu", desc: "Trường học số mUni, lớp học STEM mobiKit, eLearning trực tuyến", tag: "EdTech" },
      { icon: "🏥", name: "Y tế số · HL7 FHIR", desc: "Cloud kết nối HIS-LIS-RIS, EMR liên thông hồ sơ sức khỏe toàn TP", tag: "HealthTech" },
      { icon: "🥽", name: "VR360 · Smart Travel", desc: "Số hóa điểm đến du lịch, di tích lịch sử — trải nghiệm ảo toàn cầu", tag: "Tourism" },
      { icon: "💧", name: "IoT · Đồng hồ nước thông minh", desc: "Đọc số liệu tự động, giảm thất thoát nước, quản lý đô thị thông minh", tag: "IoT" },
      { icon: "🤖", name: "AI · Trợ lý ảo", desc: "Chatbot thông minh, Speech-to-Text, Text-to-Speech tự động hoá tác vụ", tag: "AI" },
      { icon: "🔬", name: "RPA · Tự động hóa", desc: "Tự động hoá quy trình văn phòng, giảm 70% thời gian tác vụ thủ công", tag: "RPA" },
      { icon: "👤", name: "eKYC Định danh khách hàng", desc: "Xác minh danh tính bằng AI, OCR, nhận diện khuôn mặt tức thì", tag: "Identity" },
      { icon: "📺", name: "Phát thanh số · Radio IP", desc: "Truyền dẫn âm thanh kỹ thuật số, thay thế FM truyền thống toàn diện", tag: "Media" },
    ],
  },
];

// ── GemSlideshow component (Optimized: Renders only 1 image with CSS Ken Burns animation)
function GemSlideshow({ slides, gemIdx }: { slides: typeof GEM_SLIDES[0]; gemIdx: number }) {
  const [loaded, setLoaded] = useState(false);
  const slide = slides[0]; // Render only the first slide to speed up page load

  const fallbackGrads = [
    "linear-gradient(135deg,#1a3a5c,#1e5fa8,#0fa8d6,#0dd8b8)",
    "linear-gradient(135deg,#7b3f00,#c46200,#f09000,#ffd060)",
    "linear-gradient(135deg,#004d4d,#007a6a,#00c2a0,#55eed8)",
    "linear-gradient(135deg,#2c0050,#5a1080,#9040c0,#c888f0)",
    "linear-gradient(135deg,#00254d,#004080,#0077cc,#00ccff)",
  ];

  return (
    <div className="gem-single-image-wrap" aria-label={`Ảnh minh họa địa điểm ${gemIdx + 1}`}>
      <div
        className="gem-single-slide"
        style={{ background: loaded ? undefined : fallbackGrads[gemIdx] }}
      >
        <img
          src={slide.src}
          alt={slide.alt}
          className={`gem-single-img ${loaded ? "loaded" : ""}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />
      </div>
    </div>
  );
}

// ── SolutionCarousel: auto-advancing product carousel per tab
function SolutionCarousel({ products, color }: { products: typeof SOLUTION_TABS[0]["products"]; color: string }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const VISIBLE = 3; // cards visible at once on desktop

  const advance = () => setIdx((prev) => (prev + 1) % Math.ceil(products.length / VISIBLE));

  useEffect(() => {
    if (!paused) {
      intervalRef.current = setInterval(advance, 3200);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, products.length]);

  const pages = Math.ceil(products.length / VISIBLE);
  const pageProducts = products.slice(idx * VISIBLE, idx * VISIBLE + VISIBLE);

  return (
    <div
      className="sol-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="sol-carousel-track">
        {pageProducts.map((p, i) => (
          <div
            key={`${idx}-${i}`}
            className="sol-product-card"
            style={{ animationDelay: `${i * 0.08}s`, borderTopColor: color }}
          >
            <span className="sol-product-icon">{p.icon}</span>
            <span className="sol-product-tag" style={{ background: color + "22", color }}>{p.tag}</span>
            <p className="sol-product-name">{p.name}</p>
            <p className="sol-product-desc">{p.desc}</p>
          </div>
        ))}
      </div>
      {/* Page dots */}
      <div className="sol-carousel-dots">
        {Array.from({ length: pages }).map((_, p) => (
          <button
            key={p}
            className={`sol-dot ${p === idx ? "active" : ""}`}
            onClick={() => setIdx(p)}
            style={p === idx ? { background: color } : undefined}
            aria-label={`Trang ${p + 1}`}
          />
        ))}
      </div>
      {/* Progress bar */}
      <div className="sol-progress-bar">
        <div
          className={`sol-progress-fill ${paused ? "paused" : ""}`}
          style={{ background: color }}
          key={`${idx}-${paused}`}
        />
      </div>
    </div>
  );
}

// ── SolutionTabs section
function SolutionTabs() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  const tab = SOLUTION_TABS[active];

  return (
    <section id="solutions" ref={sectionRef}>
      <div className="sol-header">
        <span className="sol-eyebrow">Hệ sinh thái chuyển đổi số MobiFone Đà Nẵng</span>
        <h2 className="sol-h2">
          Giải pháp số theo <em>từng lĩnh vực</em>
        </h2>
        <p className="sol-p">
          Từ chính quyền đến doanh nghiệp, từ y tế đến giáo dục — MobiFone cung cấp giải pháp chuyên sâu cho từng ngành tại Đà Nẵng và miền Trung.
        </p>
      </div>

      {/* Tab bar — animated entry */}
      <div className={`tab-bar ${visible ? "tab-bar-visible" : ""}`}>
        {SOLUTION_TABS.map((t, i) => (
          <button
            key={t.id}
            className={`tab-btn ${active === i ? "active" : ""}`}
            onClick={() => setActive(i)}
            style={
              active === i
                ? { background: t.gradient, borderColor: "transparent", animationDelay: `${i * 0.07}s` }
                : { animationDelay: `${i * 0.07}s` }
            }
          >
            <span className="tab-emoji">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="tab-panel-wrap">
        <div className="tab-panel-inner" key={tab.id}>
          <div className="tab-panel-header" style={{ borderLeftColor: tab.color }}>
            <p className="tab-panel-eyebrow" style={{ color: tab.color }}>
              {tab.emoji} {tab.label}
            </p>
            <h3 className="tab-panel-h3">{tab.headline}</h3>
            <p className="tab-panel-desc">{tab.desc}</p>
          </div>

          <SolutionCarousel products={tab.products} color={tab.color} />

          <div className="tab-panel-footer">
            <p className="tab-panel-footer-text">
              Đội ngũ tư vấn MobiFone Đà Nẵng sẵn sàng hỗ trợ triển khai cho đơn vị của bạn
            </p>
            <a href="tel:+84935058458" className="tab-cta" style={{ background: tab.gradient }}>
              Tư vấn miễn phí →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Bridge section
function BridgeSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const stats = [
    { num: "30%+", lbl: "Thị phần viễn thông toàn quốc" },
    { num: "99.95%", lbl: "SLA cam kết hạ tầng Cloud" },
    { num: "3", lbl: "Vùng Data Center Bắc·Trung·Nam" },
    { num: "50+", lbl: "Giải pháp số B2B & B2G" },
  ];

  return (
    <section id="bridge" ref={ref}>
      <p className="bridge-eyebrow">✦ &nbsp; Hệ sinh thái số MobiFone · Đà Nẵng thông minh &nbsp; ✦</p>
      <h2 className="bridge-h2">
        VR360 chỉ là điểm khởi&nbsp;đầu.<br className="br-desktop" />
        <em>Hạ tầng số MobiFone</em> đang<br className="br-desktop" /> kiến tạo Đà Nẵng thông&nbsp;minh.
      </h2>
      <p className="bridge-sub">
        Công nghệ số hóa di sản văn hóa và du lịch cũng chính là nền tảng đang vận hành hạ tầng chính phủ, y tế, giáo dục và kinh tế số tại Đà Nẵng. Một hệ sinh thái toàn diện — từ Cloud đến Camera AI, từ hóa đơn điện tử đến truyền thanh thông minh.
      </p>
      <div className={`bridge-stats ${visible ? "bridge-stats-visible" : ""}`}>
        {stats.map((s, i) => (
          <div key={i} className="bridge-stat" style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="bridge-stat-num">{s.num}</span>
            <span className="bridge-stat-lbl">{s.lbl}</span>
          </div>
        ))}
      </div>
      <div className="bridge-arrow">
        <a href="#solutions" className="bridge-arrow-btn">
          Khám phá hệ sinh thái giải pháp số
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        </a>
      </div>
    </section>
  );
}

// ── NavDropdown
function NavDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cols = [
    {
      title: "🏛️ Chính phủ số", items: [
        "Chỉnh lý & số hóa tài liệu", "Camera AI giám sát",
        "Kiosk tiếp dân thông minh", "Truyền thanh thông minh", "eOffice · eContract",
      ], tab: "chinh-phu",
    },
    {
      title: "☁️ Hạ tầng số", items: [
        "MobiFone Cloud IaaS", "Co-location Data Center",
        "Virtual Private Cloud", "Kubernetes · Load Balancer", "Lưu trữ mobiCloud",
      ], tab: "ha-tang",
    },
    {
      title: "🛡️ An toàn mạng", items: [
        "Đánh giá ATTT cấp độ", "SOC giám sát 24/7",
        "Tường lửa WAF / OWAF", "Antivirus Cloud", "Pentest · Red Team",
      ], tab: "an-toan",
    },
    {
      title: "💳 Kinh tế số", items: [
        "MobiFone Money", "MobiFone CA · Chữ ký số",
        "Hóa đơn điện tử Invoice", "1POS Quản lý bán hàng", "eContract · Kế toán số",
      ], tab: "kinh-te",
    },
    {
      title: "🌐 Xã hội số", items: [
        "Giáo dục số mobiEdu", "Y tế số · HL7 FHIR",
        "VR360 Smart Travel", "IoT · Đồng hồ nước", "AI · RPA · eKYC",
      ], tab: "xa-hoi",
    },
  ];

  return (
    <div className="nav-dropdown" ref={ref}>
      <button className="nav-dropdown-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
        Giải pháp B2B/B2G
        <svg className={`chevron ${open ? "open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="nav-dropdown-menu">
          <div className="dd-grid">
            {cols.map((col) => (
              <div key={col.tab} className="dd-col-head">
                <div className="dd-col-title">{col.title}</div>
                {col.items.map((item) => (
                  <a
                    key={item}
                    className="dd-item"
                    href="#solutions"
                    onClick={() => setOpen(false)}
                  >
                    {item}
                  </a>
                ))}
              </div>
            ))}
          </div>
          <div className="dd-footer">
            <span className="dd-footer-text">Xem toàn bộ hơn 50 sản phẩm & giải pháp số của MobiFone</span>
            <a href="https://mobifonesolutions.vn" target="_blank" rel="noopener noreferrer" className="dd-footer-cta">
              Xem tất cả →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════
export default function VR360Page() {
  const [stamps, setStamps] = useState<boolean[]>([false, false, false, false, false]);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUri, setGeneratedImageUri] = useState("");
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadDemand, setLeadDemand] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const passportRef = useRef<HTMLDivElement>(null);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadPhone.trim()) { alert("Vui lòng nhập Số điện thoại!"); return; }
    setIsSubmittingLead(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: leadName, phone: leadPhone, demand: leadDemand }),
      });
      const data = await res.json();
      if (data.success) {
        alert("🎉 Đăng ký thành công! MobiFone Đà Nẵng sẽ liên hệ sớm nhất.");
        setLeadName(""); setLeadPhone(""); setLeadDemand("");
        setIsConsultModalOpen(false);
      } else {
        alert("Có lỗi: " + (data.error || "Vui lòng thử lại."));
      }
    } catch { alert("Không thể kết nối. Vui lòng thử lại!"); }
    finally { setIsSubmittingLead(false); }
  };

  useEffect(() => {
    return () => { if (avatarUrl) URL.revokeObjectURL(avatarUrl); };
  }, [avatarUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
      setAvatarUrl(URL.createObjectURL(file));
      setAvatarName(file.name);
    }
  };

  const handleDownloadPassport = async () => {
    if (!userName.trim()) { alert("Vui lòng nhập tên!"); return; }
    if (!avatarUrl) { alert("Vui lòng tải ảnh đại diện!"); return; }
    if (!passportRef.current) return;
    setIsGenerating(true);
    try {
      if (document.fonts) await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 300));
      const canvas = await html2canvas(passportRef.current, {
        scale: 2, useCORS: true, backgroundColor: null,
        width: 380, height: 570, windowWidth: 380, windowHeight: 570,
        scrollX: 0, scrollY: 0,
        onclone: (clonedDoc) => {
          const card = clonedDoc.querySelector(".passport-card-capture") as HTMLDivElement | null;
          if (card) {
            card.style.cssText = "width:380px;height:570px;min-width:380px;min-height:570px;transform:none;position:static;margin:0;";
          }
        },
      });
      const imgData = canvas.toDataURL("image/png");
      setGeneratedImageUri(imgData);

      const link = document.createElement("a");
      link.href = imgData;
      link.download = "Hidden_Horizons_Passport.png";
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch { alert("Lỗi khi tạo ảnh. Vui lòng thử lại!"); }
    finally { setIsGenerating(false); }
  };

  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [nextLabel, setNextLabel] = useState("Đang tính toán...");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!now) return;
    const next = NIGHTS.find((n) => n.d > now);
    if (!next) { setNextLabel("DIFF 2026 đã kết thúc — Hẹn năm sau!"); return; }
    setNextLabel(next.n);
    const ms = next.d.getTime() - now.getTime();
    setCountdown({
      days: String(Math.floor(ms / 864e5)).padStart(2, "0"),
      hours: String(Math.floor((ms % 864e5) / 36e5)).padStart(2, "0"),
      minutes: String(Math.floor((ms % 36e5) / 6e4)).padStart(2, "0"),
      seconds: String(Math.floor((ms % 6e4) / 1e3)).padStart(2, "0"),
    });
  }, [now]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const getPillClass = (index: number) => {
    if (!now) return "d-pill upcoming";
    const n = NIGHTS[index];
    const next = NIGHTS.find((x) => x.d > now);
    if (n.d < now) return "d-pill past";
    if (next && n.d.getTime() === next.d.getTime()) return "d-pill active";
    return "d-pill upcoming";
  };

  const getTileClass = (tile: (typeof NIGHT_TILES)[number]) => {
    let c = "night-tile";
    if (tile.isHot) c += " hot";
    if (now && tile.date < now && !tile.isHot) c += " past";
    return c;
  };

  const stampIt = (idx: number) => {
    if (!stamps[idx]) {
      const s = [...stamps]; s[idx] = true; setStamps(s);
    }
  };
  const count = stamps.filter(Boolean).length;

  const gemLinks = [
    "https://smarttravel-vr.mobifone.vn/vr-tour/phong-truyen-thong-catp-da-nang/67eba4dd6ab78674fe1a834b",
    "https://smarttravel-vr.mobifone.vn/vr-tour/so-hoa-di-tich-quan-cam-le",
    "https://smarttravel-vr.mobifone.vn/vr-tour/the-pearl-hoi-an",
    "https://smarttravel-vr.mobifone.vn/vr-tour/VR360-phuong-ban-thach",
    "https://smarttravel-vr.mobifone.vn/vr-tour/di-tich-lich-s-p-hai-van",
  ];

  const gemData = [
    {
      chip: "Lực lượng vũ trang · Ký ức thành phố",
      label: "Hidden Gem #1",
      title: ["Phòng Truyền Thống", "Công An TP. Đà Nẵng"],
      tagline: '"Người giữ thành phố — và những điều chưa bao giờ kể"',
      texts: [
        <>Bạn từng đi qua trụ sở Công an Thành phố trên đường Lê Lợi bao nhiêu lần mà không biết bên trong có một căn phòng lưu giữ hơn <strong>80 năm lịch sử bảo vệ Đà Nẵng</strong>?</>,
        <>Từ tháng 8/1945 khi lực lượng Công an Đà Nẵng ra đời, đến ngày <strong>29/3/1975 — ngày thành phố hoàn toàn giải phóng.</strong> Hiện vật thật, tài liệu thật, câu chuyện thật.</>,
        <>Không hàng dài chờ đợi. Không cần hẹn trước. <strong>Khám phá bằng VR360 ngay bây giờ.</strong></>,
      ],
      tags: ["Thành lập 1945", "Đường Lê Lợi, Hải Châu", "Di sản lực lượng vũ trang", "Số hóa bởi MobiFone"],
      cta: "Bước vào Phòng Truyền Thống",
    },
    {
      chip: "Khảo cổ Chăm · Thế kỷ XI · Di tích cấp TP",
      label: "Hidden Gem #2",
      title: ["Di tích Số hóa", "Quận Cẩm Lệ"],
      tagline: '"Vùng đất 1.000 năm tuổi ngay giữa lòng Đà Nẵng"',
      texts: [
        <>Chỉ <strong>7km từ trung tâm</strong>.</>,
        <>Tại phường Hòa Thọ Đông ẩn giấu <strong>Di chỉ khảo cổ Chăm Phong Lệ</strong> — tàn tích 3 ngôi tháp từ <strong>thế kỷ XI</strong>, gần 1.000 năm tuổi. Vùng đất từ cuộc hôn nhân lịch sử vua Chế Mân và công chúa Huyền Trân 1306.</>,
        <>Di tích <strong>duy nhất trong toàn hệ thống tháp Chăm</strong> có thể nghiên cứu nền móng và hố thiêng — điều mà chưa thể nghiên cứu tại Thánh địa Mỹ Sơn.</>,
      ],
      tags: ["Thế kỷ XI", "Di tích cấp TP 2020", "Chăm Phong Lệ", "Hòa Thọ Đông, Cẩm Lệ"],
      cta: "Khám phá vùng đất nghìn năm",
    },
    {
      chip: "Ven sông Thu Bồn · Hội An · Resort boutique",
      label: "Hidden Gem #3",
      title: ["The Pearl", "Hội An"],
      tagline: '"Thưởng thức Hội An qua một lăng kính hoàn toàn khác"',
      texts: [
        <>Nằm ven <strong>sông Thu Bồn huyền thoại</strong>, The Pearl Hội An là khoảng lặng sang trọng cách xa sự nhộn nhịp của Phố cổ.</>,
        <>Sau những giây phút ngắm pháo hoa rực rỡ, bạn có thể dành thời gian tận hưởng sự bình yên tại The Pearl Hội An — <strong>nơi mặt nước phản chiếu bầu trời trong.</strong></>,
      ],
      tags: ["Ven sông Thu Bồn", "Hội An, Quảng Nam", "Resort boutique", "30 phút từ Đà Nẵng"],
      cta: "Ngắm Hội An góc chưa ai đăng",
    },
    {
      chip: "Kháng chiến · Di tích cách mạng · Quảng Nam",
      label: "Hidden Gem #4",
      title: ["Di tích Lịch Sử", "Phường Bàn Thạch"],
      tagline: '"Ngôi làng đã chiến đấu để bạn có những mùa hè rực rỡ ngày sau"',
      texts: [
        <>Tối nay bạn đứng bên sông Hàn xem pháo hoa rực sáng. Hãy dành <strong>3 phút trước đó</strong> để nhớ vùng đất miền Trung này đã từng là chiến trường.</>,
        <>Phường Bàn Thạch thuộc vùng đất Quảng Nam anh hùng — nơi người dân bảo vệ quê hương qua những năm gian khổ. <strong>Di tích cách mạng</strong> kể câu chuyện mà không sách giáo khoa nào kể đủ.</>,
        <>Lịch sử sống động qua những trải nghiệm ảo <strong>VR360.</strong></>,
      ],
      tags: ["Di tích cách mạng", "Kháng chiến miền Trung", "Phường Bàn Thạch", "Quảng Nam"],
      cta: "Bước vào trang sử sống",
    },
    {
      chip: "Di tích Quốc gia 2017 · Đèo huyền thoại · 496m",
      label: "Hidden Gem #5",
      title: ["Di tích Lịch Sử", "Phường Hải Vân"],
      tagline: '"Thiên hạ đệ nhất hùng quan"',
      texts: [
        <>Điểm đến quen thuộc để <strong>săn mây</strong> của khách du lịch khi ghé thăm Đà Nẵng. Hải Vân Quan ở độ cao gần 500m là một trong những di tích lịch sử hùng vĩ nhất Việt Nam.</>,
        <><strong>Hải Vân Quan</strong> — xây năm 1826 dưới triều Minh Mạng — ranh giới tự nhiên hai vùng khí hậu. Còn lưu dấu <strong>lô cốt Pháp, công sự chiến tranh</strong> và tầm nhìn panorama ra Biển Đông.</>,
        <><strong>Cùng ngắm Di tích Quốc gia này qua lăng kính của MobiFone VR360 nhé.</strong></>,
          ],
          tags: ["Di tích Quốc gia 2017", "496m so với mực biển", "Xây dựng 1826", "Liên Chiểu, Đà Nẵng"],
          cta: "Đứng trên đỉnh Hải Vân bằng VR360",
    },
          ];

          return (
          <div className="vr360-body">

            {/* ══ NAV ══ */}
            <nav>
              <a className="nav-logo" href="#">
                <img src="/mobifone-logo.png" alt="MobiFone" className="nav-logo-img" />
                <span className="nav-title">Hidden Horizons</span>
              </a>
              <div className="nav-links">
                <a href="#gems">VR360</a>
                <a href="#passport">Hộ chiếu số</a>
                <a href="#diff-section">DIFF 2026</a>
                <NavDropdown />
              </div>
              <a href="tel:+84935058458" className="nav-cta">📞 0935.058.458</a>
            </nav>

            {/* ══ HERO ══ */}
            <section id="hero">
              {/* Video pháo hoa DIFF — đặt file vào /public/diff-fireworks.mp4 */}
              <video
                className="hero-video"
                autoPlay
                muted
                loop
                playsInline
                poster="/diff-poster.jpg"
              >
                <source src="/diff-fireworks.mp4" type="video/mp4" />
              </video>
              <div className="hero-video-overlay" />
              <div className="hero-blob blob1" />
              <div className="hero-blob blob2" />

              <div className="skyline-wrap">
                <img src="/skyline-left.png" alt="Da Nang Left Skyline" className="skyline-img-left" />
                <img src="/skyline-right.png" alt="Da Nang Right Skyline" className="skyline-img-right" />
              </div>

              <div className="hero-wave">
                <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 C1320,45 1400,25 1440,30 L1440,60 L0,60 Z" fill="#f0f9ff" />
                </svg>
              </div>

              <div className="hero-content">
                <div className="hero-split-wrap">
                  <div className="hero-left-col">
                    <div className="hero-badge">
                      <span className="live-dot" />
                      DIFF 2026 · MobiFone Đà Nẵng · Đang diễn ra
                    </div>

                    <h1 className="hero-title">
                      <span className="highlight">Hidden</span><br className="br-desktop" /> Horizons
                    </h1>
                    <p className="hero-sub">
                      Khám phá một Đà Nẵng thật khác
                    </p>
                    <p className="hero-desc">
                      Bạn đã thấy Đà Nẵng rực rỡ. Nhưng ít ai biết rằng thành phố còn giữ những góc khác — lặng hơn, sâu hơn, và đẹp theo cách khó gọi tên.
                      MobiFone sẽ đưa bạn chu du đến 5 điểm đến ấn tượng bằng công nghệ VR360 ngay trên điện thoại của bạn.
                    </p>

                    <div className="hero-btns">
                      <a href="#gems" className="btn-primary">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" /></svg>
                        Bắt đầu khám phá
                      </a>
                      <a href="#solutions" className="btn-outline">Giải pháp số MobiFone →</a>
                    </div>

                    <div className="countdown-wrap">
                      <p className="cd-label">Đêm pháo hoa DIFF tiếp theo</p>
                      <p className="cd-next-name">{nextLabel}</p>
                      <div className="cd-timer">
                        <div className="cd-unit"><span className="cd-box">{countdown.days}</span><span className="cd-unit-lbl">ngày</span></div>
                        <span className="cd-colon">:</span>
                        <div className="cd-unit"><span className="cd-box">{countdown.hours}</span><span className="cd-unit-lbl">giờ</span></div>
                        <span className="cd-colon">:</span>
                        <div className="cd-unit"><span className="cd-box">{countdown.minutes}</span><span className="cd-unit-lbl">phút</span></div>
                        <span className="cd-colon">:</span>
                        <div className="cd-unit"><span className="cd-box">{countdown.seconds}</span><span className="cd-unit-lbl">giây</span></div>
                      </div>
                      <div className="diff-pills">
                        <span className={getPillClass(0)}>30/5 Khai mạc</span>
                        <span className={getPillClass(1)}>06/6</span>
                        <span className={getPillClass(2)}>13/6</span>
                        <span className={getPillClass(3)}>20/6</span>
                        <span className={getPillClass(4)}>27/6</span>
                        <span className={`${getPillClass(5)} final`}>11/7 ★ Chung kết</span>
                      </div>
                    </div>
                  </div>

                  <div className="hero-3d-right">
                    <div className="hero-3d-label">
                      <span className="hero-3d-sublabel">✦ Trải nghiệm được kiến tạo bởi ✦</span>
                      <span className="hero-3d-mainlabel">Hệ sinh thái chuyển đổi số MobiFone Đà Nẵng</span>
                    </div>
                    <a href="#solutions" className="floating-card fc-1"><span className="text-2xl">☁️</span><div><div className="font-bold text-sm">Hạ tầng số</div><div className="text-xs opacity-70">MobiFone Cloud & DC</div></div></a>
                    <a href="#solutions" className="floating-card fc-2"><span className="text-2xl">🛡️</span><div><div className="font-bold text-sm">An toàn mạng</div><div className="text-xs opacity-70">Bảo mật đa lớp</div></div></a>
                    <a href="#solutions" className="floating-card fc-3"><span className="text-2xl">🏛️</span><div><div className="font-bold text-base text-yellow-400">Chính phủ số</div><div className="text-xs opacity-80">Chuyển đổi số toàn diện</div></div></a>
                    <a href="#solutions" className="floating-card fc-4"><span className="text-2xl">💳</span><div><div className="font-bold text-sm">Kinh tế số</div><div className="text-xs opacity-70">Hệ sinh thái B2B</div></div></a>
                    <a href="#solutions" className="floating-card fc-5"><span className="text-2xl">🌐</span><div><div className="font-bold text-sm">Xã hội số</div><div className="text-xs opacity-70">Du lịch, Y tế & GD số</div></div></a>
                  </div>
                </div>
              </div>

              <div className="scroll-cue">
                <span>Cuộn xuống</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
              </div>
            </section>

            {/* ══ SECTION HEADER ══ */}
            <div className="section-header" id="gems">
              <span className="section-eyebrow">5 địa điểm được số hóa bởi MobiFone VR360</span>
              <h2 className="section-h2">Những <span className="grad-text">chân trời ẩn</span><br className="br-desktop" /> ngay giữa lòng Đà Nẵng</h2>
              <p className="section-p">5 điểm đến "Hidden Gems" được số hóa bằng công nghệ VR360, đưa bạn đến với những câu chuyện lịch sử, văn hóa và vẻ đẹp chưa ai kể, ngay trên điện thoại của bạn.</p>
            </div>

            {/* ══ GEM CARDS ══ */}
            <div className="gems-wrap">
              <div className="gems-grid">
                {gemData.map((gem, i) => (
                  <div key={i} className="gem-card reveal">
                    {/* Visual panel with slideshow */}
                    <a className="gem-visual" href={gemLinks[i]} target="_blank" rel="noopener noreferrer" aria-label={`Xem VR360 ${gem.title.join(" ")}`}>
                      <GemSlideshow slides={GEM_SLIDES[i]} gemIdx={i} />
                      <div className="gem-visual-overlay" />
                      <div className="gem-number-bg">{String(i + 1).padStart(2, "0")}</div>
                      <div className="gem-num-badge">{String(i + 1).padStart(2, "0")}</div>
                      <div className="gem-vr-btn">
                        <div className="vr-ring">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /></svg>
                        </div>
                        <span className="vr-ring-label">Xem VR 360°</span>
                      </div>
                      <span className="gem-chip">{gem.chip}</span>
                    </a>
                    {/* Content panel */}
                    <div className="gem-body-wrap">
                      <span className="gem-label"><span className="gem-label-dot" />{gem.label}</span>
                      <h3 className="gem-h3">{gem.title[0]}<br />{gem.title[1]}</h3>
                      <p className="gem-tagline">{gem.tagline}</p>
                      {gem.texts.map((t, ti) => <p key={ti} className="gem-text">{t}</p>)}
                      <div className="gem-tags">{gem.tags.map((tag) => <span key={tag} className="gem-tag-pill">{tag}</span>)}</div>
                      <a href={gemLinks[i]} target="_blank" rel="noopener noreferrer" className="gem-cta-link">
                        {gem.cta}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ PASSPORT ══ */}
            <section id="passport">
              <p className="passport-eyebrow">Sưu tập thành tích</p>
              <h2 className="passport-h2">Hộ Chiếu Số <span className="hl">Hidden Horizons</span></h2>
              <p className="passport-sub">Xem đủ 5 địa điểm VR360 và nhận hộ chiếu số — ảnh card cá nhân hóa để share lên Facebook, Zalo mùa DIFF 2026.</p>

              <div className="passport-card-ui">
                <div className="pass-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" /><path d="M8 12h8M12 8v8" /></svg>
                </div>
                <p className="pass-title">Hộ Chiếu Số</p>
                <p className="pass-subtitle">Hidden Horizons · DIFF 2026 · MobiFone Đà Nẵng</p>
                <div className="stamps-row">
                  {stampData.map((stamp, idx) => (
                    <div key={idx} className={`stamp-circle ${stamps[idx] ? "lit" : ""}`} onClick={() => stampIt(idx)} title={stamp.title}>
                      {stamp.emoji}<span className="stamp-lbl">{stamp.label}</span>
                    </div>
                  ))}
                </div>
                <p className="pass-progress">Đã khám phá <span>{count}</span> / 5 địa điểm</p>
                {count === 5 ? (
                  <div className="passport-form">
                    <div className="passport-form-group">
                      <label className="passport-form-label" htmlFor="userNameInput">Nhập tên của bạn</label>
                      <input id="userNameInput" type="text" className="passport-form-input" placeholder="Tên (tối đa 20 ký tự)" maxLength={20} value={userName} onChange={(e) => setUserName(e.target.value)} />
                    </div>
                    <div className="passport-form-group">
                      <label className="passport-form-label" htmlFor="avatarInput">Tải ảnh đại diện</label>
                      <div className="passport-form-file-wrap">
                        <div className="passport-form-file-btn">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                          <span>{avatarName || "Chọn ảnh từ thiết bị"}</span>
                        </div>
                        <input id="avatarInput" type="file" accept="image/*" className="passport-form-file-input" onChange={handleAvatarChange} />
                      </div>
                    </div>
                    <button className="btn-passport-submit" onClick={handleDownloadPassport} disabled={isGenerating}>
                      {isGenerating ? "Đang tạo hộ chiếu..." : "Tạo Hộ Chiếu & Tải Về"}
                    </button>
                  </div>
                ) : (
                  <button className="btn-passport" onClick={() => alert("Hãy xem đủ 5 tour VR360 và click từng stamp!")}>
                    Còn {5 - count} địa điểm nữa để hoàn thành →
                  </button>
                )}
              </div>

              {count === 5 && (
                <div className="passport-card-preview-container">
                  <p className="passport-card-preview-title">Xem trước hộ chiếu của bạn</p>
                  <div className="passport-card-capture" ref={passportRef}>
                    <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,900&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');.passport-card-capture,.passport-card-capture *{font-family:'Be Vietnam Pro',sans-serif!important;}.passport-card-name{font-family:'Playfair Display',Georgia,serif!important;}` }} />
                    <div className="passport-card-top">
                      <div className="passport-card-top-sub">MobiFone Đà Nẵng | DIFF 2026</div>
                      <div className="passport-card-top-title">
                        <svg viewBox="0 0 316 64" width="316" height="64" style={{ display: "block", margin: "0 auto" }}>
                          <defs><linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#ffe066" /><stop offset="100%" stopColor="#00ffea" /></linearGradient></defs>
                          <text x="50%" y="22" textAnchor="middle" fill="url(#tg)" fontFamily="'Playfair Display',Georgia,serif" fontSize="20" fontWeight="900" letterSpacing="1">HIDDEN HORIZONS</text>
                          <text x="50%" y="52" textAnchor="middle" fill="url(#tg)" fontFamily="'Playfair Display',Georgia,serif" fontSize="20" fontWeight="900" letterSpacing="1">PASSPORT</text>
                        </svg>
                      </div>
                    </div>
                    <div className="passport-card-mid">
                      <div className="passport-card-avatar-frame">
                        {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="passport-card-avatar" /> : <span className="passport-card-avatar-placeholder">👤</span>}
                      </div>
                      <div className="passport-card-name">{userName || "Tên của bạn"}</div>
                    </div>
                    <div className="passport-card-bottom">
                      <div className="passport-card-stamps-title">Đã thu thập 5/5 stamps</div>
                      <div className="passport-card-stamps-container">
                        <svg className="passport-card-flight-svg" viewBox="0 0 316 120" width="316" height="120">
                          <path d="M 28 85 Q 60.5 60, 93 65 T 158 80 T 223 60 T 288 75" fill="none" stroke="#ffcc00" strokeWidth="2" strokeDasharray="4,4" />
                          <text x="294" y="71" fontSize="12" fill="#ffcc00">✈️</text>
                        </svg>
                        {stampData.map((stamp, idx) => {
                          const shortNames = ["Phòng truyền thống", "Phường Cẩm Lệ", "The Pearl Hội An", "Phường Bàn Thạch", "Phường Hải Vân"];
                          const offsets = [15, -5, 10, -10, 5];
                          return (
                            <div key={idx} className="passport-card-stamp-item" style={{ transform: `translateY(${offsets[idx]}px)` }}>
                              <span className="passport-card-stamp-name">{shortNames[idx]}</span>
                              <div className="passport-card-stamp">{stamp.emoji}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="passport-card-footer">#DiffHiddenHorizons #MobiFoneVR360</div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* ══ BRIDGE ══ */}
            <BridgeSection />

            {/* ══ INDUSTRY TABS ══ */}
            <SolutionTabs />

            {/* ══ DIFF TIE-IN ══ */}
            <section id="diff-section">
              <p className="diff-eyebrow">✦ &nbsp; DIFF 2026 · 30/5 – 11/7 · Sông Hàn · Đà Nẵng &nbsp; ✦</p>
              <h2 className="diff-h2">Khám phá ban ngày.<br className="br-desktop" /> Ngước nhìn <span className="grad-text">pháo hoa</span> ban&nbsp;đêm.</h2>
              <p className="diff-body">DIFF 2026 — "Da Nang United Horizons" — quy tụ 10 đội pháo hoa từ 9 quốc gia, 6 đêm tranh tài. Mỗi đêm là một câu chuyện được kể bằng ánh sáng trên bầu trời sông Hàn.</p>
              <div className="nights-grid">
                {NIGHT_TILES.map((tile, idx) => (
                  <div key={idx} className={getTileClass(tile)}>
                    <span className="night-date">{tile.dateStr}</span>
                    <span className="night-name">{tile.name}</span>
                  </div>
                ))}
              </div>
              <div className="diff-btns">
                <a href="https://danangfantasticity.com/en/kham-pha/gia-ve-va-lich-thi-dau-le-hoi-phao-hoa-diff-2026" target="_blank" rel="noopener noreferrer" className="btn-blue">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                  Đặt vé DIFF 2026
                </a>
                <a href="#gems" className="btn-border">Xem thêm VR360</a>
              </div>
            </section>

            {/* ══ B2B ══ */}
            <section id="b2b">
              <div className="b2b-inner">
                <div className="b2b-icon-box">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /><circle cx="9" cy="10" r="2" /><path d="M15 8h2M15 12h2" /></svg>
                </div>
                <div>
                  <p className="b2b-eyebrow">Dành cho doanh nghiệp tại Đà Nẵng</p>
                  <h3 className="b2b-h3">Địa điểm của bạn chưa có VR360?<br className="br-desktop" /> MobiFone Đà Nẵng số hóa trong 7&nbsp;ngày.</h3>
                  <p className="b2b-p">Khách sạn, bảo tàng, khu du lịch, nhà hàng, showroom, trường học — bất kỳ không gian nào cũng có thể trở thành trải nghiệm ảo 360°. Tư vấn miễn phí, triển khai nhanh.</p>
                  <a href="tel:+84935058458" className="b2b-link">
                    Tư vấn miễn phí ngay: 0935.058.458
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </a>
                  <div className="b2b-lead-trigger-wrap">
                    <a href="#" className="b2b-lead-trigger" onClick={(e) => { e.preventDefault(); setIsConsultModalOpen(true); }}>
                      ✍️ Hoặc đăng ký thông tin nhận tư vấn tại đây
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* ══ FOOTER ══ */}
            <footer>
              <div className="footer-inner">
                <div className="footer-brand">
                  <img src="/mobifone-logo.png" alt="MobiFone" className="footer-logo-img" />
                  <p className="footer-tagline">Trung tâm Kinh doanh Giải pháp số</p>
                  <p className="footer-address">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" className="location-svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    <span>586 Nguyễn Hữu Thọ, P. Cẩm Lệ, TP. Đà Nẵng</span>
                  </p>
                </div>
                <div className="footer-links">
                  <a href="https://it.mobifone.vn" target="_blank" rel="noopener noreferrer">Giải pháp số</a>
                  <a href="https://it.mobifone.vn" target="_blank" rel="noopener noreferrer">Hạ tầng số</a>
                  <a href="https://smarttravel-vr.mobifone.vn" target="_blank" rel="noopener noreferrer">Smart Travel VR</a>
                </div>
                <div className="footer-right">
                  <span className="footer-right-lbl">Tư vấn miễn phí</span>
                  <a href="tel:+84935058458" className="footer-hotline">0935.058.458</a>
                </div>
              </div>
              <p className="footer-bottom">© 2026 MobiFone Đà Nẵng · Hidden Horizons VR360 · Mùa DIFF 2026 · #DiffHiddenHorizons</p>
            </footer>

            {/* ══ B2B MODAL ══ */}
            {isConsultModalOpen && (
              <div className="modal-overlay" onClick={() => setIsConsultModalOpen(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <button className="modal-close" onClick={() => setIsConsultModalOpen(false)}>&times;</button>
                  <h3 className="modal-title">Đăng ký nhận tư vấn</h3>
                  <p className="modal-subtitle">MobiFone Đà Nẵng sẽ liên hệ hỗ trợ bạn sớm nhất!</p>
                  <form onSubmit={handleSubmitLead} className="modal-form">
                    <div className="modal-form-group">
                      <label className="modal-label" htmlFor="leadNameInput">Họ và tên</label>
                      <input id="leadNameInput" type="text" className="modal-input" placeholder="Nhập họ và tên (không bắt buộc)" value={leadName} onChange={(e) => setLeadName(e.target.value)} />
                    </div>
                    <div className="modal-form-group">
                      <label className="modal-label" htmlFor="leadPhoneInput">Số điện thoại <span className="required-star">*</span></label>
                      <input id="leadPhoneInput" type="tel" required className="modal-input" placeholder="Số điện thoại (bắt buộc)" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
                    </div>
                    <div className="modal-form-group">
                      <label className="modal-label" htmlFor="leadDemandInput">Nhu cầu tư vấn</label>
                      <textarea id="leadDemandInput" className="modal-textarea" placeholder="Ví dụ: Số hóa khách sạn, showroom, resort..." value={leadDemand} onChange={(e) => setLeadDemand(e.target.value)} rows={3} />
                    </div>
                    <button type="submit" className="modal-submit-btn" disabled={isSubmittingLead}>
                      {isSubmittingLead ? "Đang gửi..." : "Gửi yêu cầu"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ══ PASSPORT MODAL FOR MOBILE ══ */}
            {generatedImageUri && (
              <div className="modal-overlay" onClick={() => setGeneratedImageUri("")}>
                <div className="modal-content text-center" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "390px", textAlign: "center" }}>
                  <button className="modal-close" onClick={() => setGeneratedImageUri("")}>&times;</button>
                  <h3 className="modal-title" style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Hộ chiếu của bạn đã sẵn sàng!</h3>
                  <p className="modal-subtitle" style={{ marginBottom: "1rem", fontSize: "0.8rem", lineHeight: "1.4" }}>
                    Vui lòng <strong>chạm và giữ ảnh</strong> bên dưới, sau đó chọn <strong>"Lưu hình ảnh"</strong> (Save Image) để tải về điện thoại.
                  </p>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.2rem" }}>
                    <img
                      src={generatedImageUri}
                      alt="Hidden Horizons Passport"
                      style={{ width: "100%", maxWidth: "280px", borderRadius: "12px", boxShadow: "0 8px 24px rgba(0,0,0,0.25)", border: "1px solid rgba(0,119,204,0.15)" }}
                    />
                  </div>
                  <button
                    className="modal-submit-btn"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = generatedImageUri;
                      link.download = "Hidden_Horizons_Passport.png";
                      document.body.appendChild(link); link.click(); document.body.removeChild(link);
                    }}
                    style={{ width: "100%", marginTop: "0" }}
                  >
                    Tải trực tiếp (Nếu trình duyệt hỗ trợ)
                  </button>
                </div>
              </div>
            )}
          </div>
          );
}
