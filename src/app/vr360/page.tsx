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

export default function VR360Page() {
  const [stamps, setStamps] = useState<boolean[]>([false, false, false, false, false]);
  const [userName, setUserName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarName, setAvatarName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // States for B2B Lead Consultation Modal
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadDemand, setLeadDemand] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  const passportRef = useRef<HTMLDivElement>(null);

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadPhone.trim()) {
      alert("Vui lòng nhập Số điện thoại!");
      return;
    }

    setIsSubmittingLead(true);
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: leadName,
          phone: leadPhone,
          demand: leadDemand,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("🎉 Đăng ký thông tin tư vấn thành công! MobiFone Đà Nẵng sẽ liên hệ lại bạn sớm nhất.");
        setLeadName("");
        setLeadPhone("");
        setLeadDemand("");
        setIsConsultModalOpen(false);
      } else {
        alert("Có lỗi xảy ra: " + (data.error || "Vui lòng thử lại sau."));
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  useEffect(() => {
    return () => {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (avatarUrl) {
        URL.revokeObjectURL(avatarUrl);
      }
      setAvatarUrl(URL.createObjectURL(file));
      setAvatarName(file.name);
    }
  };

  const handleDownloadPassport = async () => {
    if (!userName.trim()) {
      alert("Vui lòng nhập tên của bạn!");
      return;
    }
    if (!avatarUrl) {
      alert("Vui lòng tải ảnh đại diện!");
      return;
    }
    if (!passportRef.current) return;

    setIsGenerating(true);
    try {
      if (typeof window !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      const canvas = await html2canvas(passportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        width: 380,
        height: 570,
        windowWidth: 380,
        windowHeight: 570,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const card = clonedDoc.querySelector(".passport-card-capture") as HTMLDivElement | null;
          if (card) {
            card.style.width = "380px";
            card.style.height = "570px";
            card.style.minWidth = "380px";
            card.style.minHeight = "570px";
            card.style.transform = "none";
            card.style.position = "static";
            card.style.margin = "0";
          }
        },
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "Hidden_Horizons_Passport.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Lỗi khi tạo ảnh hộ chiếu:", error);
      alert("Đã xảy ra lỗi khi tạo ảnh hộ chiếu. Vui lòng thử lại!");
    } finally {
      setIsGenerating(false);
    }
  };
  const [countdown, setCountdown] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });
  const [nextLabel, setNextLabel] = useState("Đang tính toán...");
  const [now, setNow] = useState<Date | null>(null);

  // Set the current time only after mounting to avoid hydration mismatches
  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update countdown
  useEffect(() => {
    if (!now) return;

    const next = NIGHTS.find((n) => n.d > now);
    if (!next) {
      setNextLabel("DIFF 2026 đã kết thúc — Hẹn năm sau!");
      setCountdown({ days: "00", hours: "00", minutes: "00", seconds: "00" });
      return;
    }

    setNextLabel(next.n);
    const ms = next.d.getTime() - now.getTime();
    const d = Math.floor(ms / 864e5);
    const h = Math.floor((ms % 864e5) / 36e5);
    const m = Math.floor((ms % 36e5) / 6e4);
    const s = Math.floor((ms % 6e4) / 1e3);

    setCountdown({
      days: String(d).padStart(2, "0"),
      hours: String(h).padStart(2, "0"),
      minutes: String(m).padStart(2, "0"),
      seconds: String(s).padStart(2, "0"),
    });
  }, [now]);

  // Scroll reveal animation observer
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => io.observe(el));

    return () => {
      elements.forEach((el) => io.unobserve(el));
    };
  }, []);

  const getPillClass = (index: number) => {
    if (!now) {
      // Fallback matching original HTML values pre-hydration
      return index === 0 ? "upcoming" : "upcoming";
    }
    const dateObj = NIGHTS[index];
    const next = NIGHTS.find((n) => n.d > now);
    if (dateObj.d < now) return "d-pill past";
    if (next && dateObj.d.getTime() === next.d.getTime()) return "d-pill active";
    return "d-pill upcoming";
  };

  const getTileClass = (tile: typeof NIGHT_TILES[number]) => {
    let classes = "night-tile";
    if (tile.isHot) {
      classes += " hot";
    }
    if (now) {
      if (tile.date < now && !tile.isHot) {
        classes += " past";
      }
    } else {
      if (tile.dateStr === "30/5" || tile.dateStr === "06/6" || tile.dateStr === "13/6") {
        classes += " past";
      }
    }
    return classes;
  };

  const stampIt = (idx: number) => {
    if (!stamps[idx]) {
      const newStamps = [...stamps];
      newStamps[idx] = true;
      setStamps(newStamps);
    }
  };

  const count = stamps.filter(Boolean).length;

  const handlePassport = () => {
    if (count < 5) {
      alert("Hãy xem đủ 5 tour VR360 và click từng stamp để mở khóa hộ chiếu của bạn!");
    } else {
      alert(
        "🎉 Chúc mừng! Bạn đã hoàn thành Hidden Horizons DIFF 2026!\n\nChức năng tạo ảnh hộ chiếu cá nhân sẽ được đội kỹ thuật MobiFone Đà Nẵng tích hợp.\nHãy share hashtag #DiffHiddenHorizons #MobiFoneVR360 để nhận quà từ MobiFone!"
      );
    }
  };

  return (
    <div className="vr360-body">
      {/* ══ NAV ══ */}
      <nav>
        <a className="nav-logo" href="#">
          <img src="/mobifone-logo.png" alt="MobiFone" className="nav-logo-img" />
          <span className="nav-title">Hidden Horizons</span>
        </a>
        <div className="nav-links">
          <a href="#gems">5 Địa điểm</a>
          <a href="#passport">Hộ chiếu số</a>
          <a href="#diff-section">DIFF 2026</a>
          <a href="#b2b">Cho doanh nghiệp</a>
        </div>
        <a href="tel:+84935058458" className="nav-cta">
          📞 Tư vấn: 0935.058.458
        </a>
      </nav>

      {/* ══ HERO ══ */}
      <section id="hero">
        <div className="hero-gradient"></div>
        <div className="hero-blob blob1"></div>
        <div className="hero-blob blob2"></div>
        <div className="hero-blob blob3"></div>

        {/* Giao diện địa danh Đà Nẵng sử dụng hình ảnh thực tế từ bản phác thảo gốc đính kèm */}
        <div className="skyline-wrap">
          <img src="/skyline-left.png" alt="Da Nang Left Skyline" className="skyline-img-left" />
          <img src="/skyline-right.png" alt="Da Nang Right Skyline" className="skyline-img-right" />
        </div>

        {/* wave bottom */}
        <div className="hero-wave">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,30 C200,60 400,0 600,30 C800,60 1000,0 1200,30 C1320,45 1400,25 1440,30 L1440,60 L0,60 Z" fill="#f0f9ff" />
          </svg>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="live-dot"></span>
            DIFF 2026 · MobiFone Đà Nẵng · VR360
          </div>

          <h1 className="hero-title">
            <span className="highlight">Hidden</span>
            <br />
            Horizons
          </h1>
          <p className="hero-sub">Khám phá Đà Nẵng chưa ai thấy — ngay trên điện thoại của bạn</p>

          <p className="hero-desc">
            Trong khi cả thành phố <strong>ngước nhìn pháo hoa</strong> trên sông Hàn, có 5 địa điểm đặc biệt đang chờ bạn — không chen chúc, không
            vé vào cửa, không cần di chuyển. <strong>Chỉ cần điện thoại trong tay.</strong>
          </p>

          <div className="hero-btns">
            <a href="#gems" className="btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
              </svg>
              Bắt đầu khám phá
            </a>
            <a href="#passport" className="btn-outline">
              Nhận Hộ Chiếu Số 🗺️
            </a>
          </div>

          {/* Countdown */}
          <div className="countdown-wrap">
            <p className="cd-label">Đêm pháo hoa DIFF tiếp theo</p>
            <p className="cd-next-name">{nextLabel}</p>
            <div className="cd-timer">
              <div className="cd-unit">
                <span className="cd-box">{countdown.days}</span>
                <span className="cd-unit-lbl">ngày</span>
              </div>
              <span className="cd-colon">:</span>
              <div className="cd-unit">
                <span className="cd-box">{countdown.hours}</span>
                <span className="cd-unit-lbl">giờ</span>
              </div>
              <span className="cd-colon">:</span>
              <div className="cd-unit">
                <span className="cd-box">{countdown.minutes}</span>
                <span className="cd-unit-lbl">phút</span>
              </div>
              <span className="cd-colon">:</span>
              <div className="cd-unit">
                <span className="cd-box">{countdown.seconds}</span>
                <span className="cd-unit-lbl">giây</span>
              </div>
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

        <div className="scroll-cue">
          <span>Cuộn xuống</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ══ SECTION HEADER ══ */}
      <div className="section-header" id="gems">
        <span className="section-eyebrow">5 địa điểm được số hóa bởi MobiFone VR360</span>
        <h2 className="section-h2">
          Những <span className="grad-text">chân trời ẩn</span>
          <br />
          ngay giữa lòng Đà Nẵng
        </h2>
        <p className="section-p">
          MobiFone đã số hóa những không gian này bằng công nghệ VR360. Bạn không cần đến tận nơi để cảm nhận — nhưng sau chuyến phiêu lưu VR360 này chúng tôi cược rằng bạn sẽ rất muốn đi khám phá đấy.
        </p>
      </div>

      {/* ══ GEM CARDS ══ */}
      <div className="gems-wrap">
        <div className="gems-grid">
          {/* GEM 1 */}
          <div className="gem-card reveal">
            <a
              className="gem-visual"
              href="https://smarttravel-vr.mobifone.vn/vr-tour/phong-truyen-thong-catp-da-nang/67eba4dd6ab78674fe1a834b"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="gem-visual-bg"></div>
              <div className="gem-visual-overlay"></div>
              <div className="gem-visual-pattern"></div>
              <div className="gem-number-bg">01</div>
              <div className="gem-num-badge">01</div>
              <div className="gem-vr-btn">
                <div className="vr-ring">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </div>
                <span className="vr-ring-label">Xem VR 360°</span>
              </div>
              <span className="gem-chip">Lực lượng vũ trang · Ký ức thành phố</span>
            </a>
            <div className="gem-body-wrap">
              <span className="gem-label">
                <span className="gem-label-dot"></span> Hidden Gem #1
              </span>
              <h3 className="gem-h3">
                Phòng Truyền Thống
                <br />
                Công An TP. Đà Nẵng
              </h3>
              <p className="gem-tagline">"Người giữ thành phố — và những điều họ chưa bao giờ kể công"</p>
              <p className="gem-text">
                Bạn đã đi qua trụ sở Công an trên đường Lê Lợi bao nhiêu lần mà không biết bên trong có một căn phòng lưu giữ hơn{" "}
                <strong>80 năm lịch sử bảo vệ Đà Nẵng</strong>?
              </p>
              <p className="gem-text">
                Từ tháng 8/1945 khi lực lượng Công an Đà Nẵng ra đời trong cao trào cách mạng, đến ngày{" "}
                <strong>29/3/1975 — ngày thành phố hoàn toàn giải phóng.</strong> Những hiện vật thật, tài liệu thật về những người đã giữ bình yên
                cho từng con phố bạn đang đi hôm nay.
              </p>
              <p className="gem-text">
                Không có hàng dài chờ đợi. Không cần hẹn trước. <strong>Bước vào bằng VR360 ngay bây giờ.</strong>
              </p>
              <div className="gem-tags">
                <span className="gem-tag-pill">Thành lập 1945</span>
                <span className="gem-tag-pill">Đường Lê Lợi, Hải Châu</span>
                <span className="gem-tag-pill">Di sản lực lượng vũ trang</span>
                <span className="gem-tag-pill">Số hóa bởi MobiFone</span>
              </div>
              <a
                href="https://smarttravel-vr.mobifone.vn/vr-tour/phong-truyen-thong-catp-da-nang/67eba4dd6ab78674fe1a834b"
                target="_blank"
                rel="noopener noreferrer"
                className="gem-cta-link"
              >
                Bước vào Phòng Truyền Thống
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* GEM 2 */}
          <div className="gem-card reveal">
            <a
              className="gem-visual"
              href="https://smarttravel-vr.mobifone.vn/vr-tour/so-hoa-di-tich-quan-cam-le"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="gem-visual-bg"></div>
              <div className="gem-visual-overlay"></div>
              <div className="gem-visual-pattern"></div>
              <div className="gem-number-bg">02</div>
              <div className="gem-num-badge">02</div>
              <div className="gem-vr-btn">
                <div className="vr-ring">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </div>
                <span className="vr-ring-label">Xem VR 360°</span>
              </div>
              <span className="gem-chip">Khảo cổ Chăm · Thế kỷ XI · Di tích cấp TP</span>
            </a>
            <div className="gem-body-wrap">
              <span className="gem-label">
                <span className="gem-label-dot"></span> Hidden Gem #2
              </span>
              <h3 className="gem-h3">
                Di tích Số hóa
                <br />
                Quận Cẩm Lệ
              </h3>
              <p className="gem-tagline">"Vùng đất 1.000 năm tuổi ngay giữa lòng Đà Nẵng — bị lãng quên vì quá gần"</p>
              <p className="gem-text">
                Chỉ <strong>7km từ trung tâm</strong>, nhưng không ai đặt Cẩm Lệ vào danh sách du lịch. Sai lầm lớn nhất của những du khách vội vã.
              </p>
              <p className="gem-text">
                Tại phường Hòa Thọ Đông ẩn giấu <strong>Di chỉ khảo cổ Chăm Phong Lệ</strong> — tàn tích của ít nhất 3 ngôi tháp Chăm xây dựng từ{" "}
                <strong>thế kỷ XI</strong>, gần 1.000 năm tuổi. Vùng đất được chuyển giao từ Champa sau cuộc hôn nhân lịch sử giữa vua Chế Mân và
                công chúa Huyền Trân năm 1306.
              </p>
              <p className="gem-text">
                Di tích <strong>duy nhất trong toàn hệ thống tháp Chăm</strong> có thể nghiên cứu phần nền móng và hố thiêng — thứ mà ngay cả Mỹ
                Sơn không có.
              </p>
              <div className="gem-tags">
                <span className="gem-tag-pill">Thế kỷ XI</span>
                <span className="gem-tag-pill">Di tích cấp TP 2020</span>
                <span className="gem-tag-pill">Chăm Phong Lệ</span>
                <span className="gem-tag-pill">Hòa Thọ Đông, Cẩm Lệ</span>
              </div>
              <a
                href="https://smarttravel-vr.mobifone.vn/vr-tour/so-hoa-di-tich-quan-cam-le"
                target="_blank"
                rel="noopener noreferrer"
                className="gem-cta-link"
              >
                Khám phá vùng đất nghìn năm
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* GEM 3 */}
          <div className="gem-card reveal">
            <a
              className="gem-visual"
              href="https://smarttravel-vr.mobifone.vn/vr-tour/the-pearl-hoi-an"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="gem-visual-bg"></div>
              <div className="gem-visual-overlay"></div>
              <div className="gem-visual-pattern"></div>
              <div className="gem-number-bg">03</div>
              <div className="gem-num-badge">03</div>
              <div className="gem-vr-btn">
                <div className="vr-ring">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </div>
                <span className="vr-ring-label">Xem VR 360°</span>
              </div>
              <span className="gem-chip">Ven sông Thu Bồn · Hội An · Resort boutique</span>
            </a>
            <div className="gem-body-wrap">
              <span className="gem-label">
                <span className="gem-label-dot"></span> Hidden Gem #3
              </span>
              <h3 className="gem-h3">
                The Pearl
                <br />
                Hội An
              </h3>
              <p className="gem-tagline">"Thưởng thức 'Hội An' qua 1 lăng kính hoàn toàn khác"</p>
              <p className="gem-text">Bạn đã thấy đủ ảnh đèn lồng Hội An chưa?  Hãy ngã lưng và thương thức không khí cực lãng mạn tại đây.</p>
              <p className="gem-text">
                Nằm ven <strong>sông Thu Bồn huyền thoại</strong>, The Pearl Hội An là khoảng lặng sang trọng cách xa đám đông phố cổ — nơi mặt
                nước phản chiếu bầu trời và không khí Hội An hiện ra theo cách người ta hay quên mất: <strong>thật sự bình yên.</strong>
              </p>
              <p className="gem-text">
                Xem VR360 trước để hiểu tại sao đây là lý do khiến du khách quay lại Hội An lần thứ hai, lần thứ ba — nhưng theo{" "}
                <strong>một cách hoàn toàn khác.</strong>
              </p>
              <div className="gem-tags">
                <span className="gem-tag-pill">Ven sông Thu Bồn</span>
                <span className="gem-tag-pill">Hội An, Quảng Nam</span>
                <span className="gem-tag-pill">Resort boutique</span>
                <span className="gem-tag-pill">30 phút từ Đà Nẵng</span>
              </div>
              <a
                href="https://smarttravel-vr.mobifone.vn/vr-tour/the-pearl-hoi-an"
                target="_blank"
                rel="noopener noreferrer"
                className="gem-cta-link"
              >
                Ngắm Hội An góc chưa ai đăng
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* GEM 4 */}
          <div className="gem-card reveal">
            <a
              className="gem-visual"
              href="https://smarttravel-vr.mobifone.vn/vr-tour/VR360-phuong-ban-thach"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="gem-visual-bg"></div>
              <div className="gem-visual-overlay"></div>
              <div className="gem-visual-pattern"></div>
              <div className="gem-number-bg">04</div>
              <div className="gem-num-badge">04</div>
              <div className="gem-vr-btn">
                <div className="vr-ring">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </div>
                <span className="vr-ring-label">Xem VR 360°</span>
              </div>
              <span className="gem-chip">Kháng chiến · Di tích cách mạng · Quảng Nam</span>
            </a>
            <div className="gem-body-wrap">
              <span className="gem-label">
                <span className="gem-label-dot"></span> Hidden Gem #4
              </span>
              <h3 className="gem-h3">
                Di tích Lịch Sử
                <br />
                Phường Bàn Thạch
              </h3>
              <p className="gem-tagline">"Ngôi làng đã chiến đấu để bạn có mùa hè này"</p>
              <p className="gem-text">
                Tối nay bạn sẽ đứng bên sông Hàn xem pháo hoa rực sáng. Hãy dành <strong>3 phút trước đó</strong> để nhớ rằng vùng đất miền Trung
                này đã từng là chiến trường.
              </p>
              <p className="gem-text">
                Phường Bàn Thạch thuộc vùng đất Quảng Nam anh hùng — nơi người dân đã bảo vệ quê hương qua những năm tháng gian khổ nhất. Những{" "}
                <strong>di tích cách mạng</strong> tại đây kể câu chuyện về ý chí mà không một trang sách giáo khoa nào kể đủ.
              </p>
              <p className="gem-text">
                Lịch sử sống động hơn khi bạn đứng giữa nó. <strong>Dù là ảo, cảm xúc là thật.</strong>
              </p>
              <div className="gem-tags">
                <span className="gem-tag-pill">Di tích cách mạng</span>
                <span className="gem-tag-pill">Kháng chiến miền Trung</span>
                <span className="gem-tag-pill">Phường Bàn Thạch</span>
                <span className="gem-tag-pill">Quảng Nam</span>
              </div>
              <a
                href="https://smarttravel-vr.mobifone.vn/vr-tour/VR360-phuong-ban-thach"
                target="_blank"
                rel="noopener noreferrer"
                className="gem-cta-link"
              >
                Bước vào trang sử sống
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>

          {/* GEM 5 */}
          <div className="gem-card reveal">
            <a
              className="gem-visual"
              href="https://smarttravel-vr.mobifone.vn/vr-tour/di-tich-lich-s-p-hai-van"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="gem-visual-bg"></div>
              <div className="gem-visual-overlay"></div>
              <div className="gem-visual-pattern"></div>
              <div className="gem-number-bg">05</div>
              <div className="gem-num-badge">05</div>
              <div className="gem-vr-btn">
                <div className="vr-ring">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </div>
                <span className="vr-ring-label">Xem VR 360°</span>
              </div>
              <span className="gem-chip">Di tích Quốc gia 2017 · Đèo huyền thoại · 496m</span>
            </a>
            <div className="gem-body-wrap">
              <span className="gem-label">
                <span className="gem-label-dot"></span> Hidden Gem #5
              </span>
              <h3 className="gem-h3">
                Di tích Lịch Sử
                <br />
                Phường Hải Vân
              </h3>
              <p className="gem-tagline">"Thiên hạ đệ nhất hùng quan — và bạn chưa thật sự đứng ở đó"</p>
              <p className="gem-text">
                Hàng triệu người <strong>chui qua hầm Hải Vân</strong> mỗi năm. Rất ít người biết rằng phía trên đầu họ, ở độ cao gần 500m, là một
                trong những di tích lịch sử hùng vĩ nhất Việt Nam.
              </p>
              <p className="gem-text">
                <strong>Hải Vân Quan</strong> — xây năm 1826 dưới triều vua Minh Mạng — là ranh giới tự nhiên giữa hai vùng khí hậu: một phía nắng
                Đà Nẵng, một phía mưa Huế. Còn lưu dấu <strong>lô cốt Pháp, công sự chiến tranh</strong> và tầm nhìn panorama ra Biển Đông chỉ người
                leo đèo mới biết.
              </p>
              <p className="gem-text">
                <strong>Di tích cấp Quốc gia</strong> từ 2017. Được xếp hạng — nhưng vẫn bị bỏ qua. Bạn sắp là ngoại lệ.
              </p>
              <div className="gem-tags">
                <span className="gem-tag-pill">Di tích Quốc gia 2017</span>
                <span className="gem-tag-pill">496m so với mực biển</span>
                <span className="gem-tag-pill">Xây dựng 1826</span>
                <span className="gem-tag-pill">Liên Chiểu, Đà Nẵng</span>
              </div>
              <a
                href="https://smarttravel-vr.mobifone.vn/vr-tour/di-tich-lich-s-p-hai-van"
                target="_blank"
                rel="noopener noreferrer"
                className="gem-cta-link"
              >
                Đứng trên đỉnh Hải Vân bằng VR360
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ══ PASSPORT ══ */}
      <section id="passport">
        <p className="passport-eyebrow">Sưu tập thành tích</p>
        <h2 className="passport-h2">
          Hộ Chiếu Số <span className="hl">Hidden Horizons</span>
        </h2>
        <p className="passport-sub">
          Xem đủ 5 địa điểm VR360 và nhận hộ chiếu số của bạn — ảnh card cá nhân hóa để share lên Facebook, Zalo và tự hào về những nơi bạn đã
          "đặt chân" đến mùa DIFF 2026.
        </p>

        <div className="passport-card-ui">
          <div className="pass-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <p className="pass-title">Hộ Chiếu Số</p>
          <p className="pass-subtitle">Hidden Horizons · DIFF 2026 · MobiFone Đà Nẵng</p>
          <div className="stamps-row">
            {stampData.map((stamp, idx) => (
              <div
                key={idx}
                className={`stamp-circle ${stamps[idx] ? "lit" : ""}`}
                onClick={() => stampIt(idx)}
                title={stamp.title}
              >
                {stamp.emoji}
                <span className="stamp-lbl">{stamp.label}</span>
              </div>
            ))}
          </div>
          <p className="pass-progress">
            Đã khám phá <span>{count}</span> / 5 địa điểm
          </p>
          {count === 5 ? (
            <div className="passport-form">
              <div className="passport-form-group">
                <label className="passport-form-label" htmlFor="userNameInput">
                  Nhập tên của bạn
                </label>
                <input
                  id="userNameInput"
                  type="text"
                  className="passport-form-input"
                  placeholder="Nhập tên của bạn (tối đa 20 ký tự)"
                  maxLength={20}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </div>

              <div className="passport-form-group">
                <label className="passport-form-label" htmlFor="avatarInput">
                  Tải ảnh đại diện
                </label>
                <div className="passport-form-file-wrap">
                  <div className="passport-form-file-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    <span>{avatarName || "Chọn ảnh từ thiết bị"}</span>
                  </div>
                  <input
                    id="avatarInput"
                    type="file"
                    accept="image/*"
                    className="passport-form-file-input"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>

              <button
                className="btn-passport-submit"
                onClick={handleDownloadPassport}
                disabled={isGenerating}
              >
                {isGenerating ? "Đang tạo hộ chiếu..." : "Tạo Hộ Chiếu & Tải Về"}
              </button>
            </div>
          ) : (
            <button className="btn-passport" onClick={handlePassport}>
              Còn {5 - count} địa điểm nữa để hoàn thành →
            </button>
          )}
        </div>

        {count === 5 && (
          <div className="passport-card-preview-container">
            <p className="passport-card-preview-title">Xem trước hộ chiếu của bạn</p>
            <div className="passport-card-capture" ref={passportRef}>
              <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700;1,900&family=Be+Vietnam+Pro:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
                
                .passport-card-capture,
                .passport-card-capture * {
                  font-family: 'Be Vietnam Pro', sans-serif !important;
                }
                .passport-card-top-title text,
                .passport-card-name {
                  font-family: 'Playfair Display', Georgia, serif !important;
                }
              ` }} />
              <div className="passport-card-top">
                <div className="passport-card-top-sub">MobiFone Đà Nẵng | DIFF 2026</div>
                <div className="passport-card-top-title">
                  <svg viewBox="0 0 316 64" width="316" height="64" style={{ display: 'block', margin: '0 auto' }}>
                    <defs>
                      <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ffe066" />
                        <stop offset="100%" stopColor="#00ffea" />
                      </linearGradient>
                    </defs>
                    <text
                      x="50%"
                      y="22"
                      textAnchor="middle"
                      fill="url(#titleGrad)"
                      fontFamily="'Playfair Display', Georgia, serif"
                      fontSize="20"
                      fontWeight="900"
                      letterSpacing="1"
                    >
                      HIDDEN HORIZONS
                    </text>
                    <text
                      x="50%"
                      y="52"
                      textAnchor="middle"
                      fill="url(#titleGrad)"
                      fontFamily="'Playfair Display', Georgia, serif"
                      fontSize="20"
                      fontWeight="900"
                      letterSpacing="1"
                    >
                      PASSPORT
                    </text>
                  </svg>
                </div>
              </div>

              <div className="passport-card-mid">
                <div className="passport-card-avatar-frame">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="passport-card-avatar"
                    />
                  ) : (
                    <span className="passport-card-avatar-placeholder">👤</span>
                  )}
                </div>
                <div className="passport-card-name">
                  {userName || "Tên của bạn"}
                </div>
              </div>

              <div className="passport-card-bottom">
                <div className="passport-card-stamps-title">Đã thu thập 5/5 stamps</div>
                <div className="passport-card-stamps-container">
                  {/* Flight line path */}
                  <svg className="passport-card-flight-svg" viewBox="0 0 316 120" width="316" height="120">
                    <path
                      d="M 28 85 Q 60.5 60, 93 65 T 158 80 T 223 60 T 288 75"
                      fill="none"
                      stroke="#ffcc00"
                      strokeWidth="2"
                      strokeDasharray="4,4"
                    />
                    <text x="294" y="71" fontSize="12" fill="#ffcc00">✈️</text>
                  </svg>

                  {/* Stamp Items */}
                  {stampData.map((stamp, idx) => {
                    const shortNames = [
                      "Phòng truyền thống",
                      "Phường Cẩm Lệ",
                      "The Pearl Hội An",
                      "Phường Bàn Thạch",
                      "Phường Hải Vân"
                    ];
                    const offsets = [15, -5, 10, -10, 5];
                    return (
                      <div
                        key={idx}
                        className="passport-card-stamp-item"
                        style={{
                          transform: `translateY(${offsets[idx]}px)`,
                        }}
                      >
                        <span className="passport-card-stamp-name">
                          {shortNames[idx]}
                        </span>
                        <div className="passport-card-stamp">
                          {stamp.emoji}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="passport-card-footer">
                  #DiffHiddenHorizons #MobiFoneVR360
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ══ DIFF TIE-IN ══ */}
      <section id="diff-section">
        <p className="diff-eyebrow">✦ &nbsp; DIFF 2026 · 30/5 – 11/7 · Sông Hàn · Đà Nẵng &nbsp; ✦</p>
        <h2 className="diff-h2">
          Khám phá ban ngày.
          <br />
          Ngước nhìn <span className="grad-text">pháo hoa</span> ban đêm.
        </h2>
        <p className="diff-body">
          DIFF 2026 — "Da Nang United Horizons" — quy tụ 10 đội pháo hoa từ 9 quốc gia, 6 đêm tranh tài từ cuối tháng 5 đến giữa tháng 7. Mỗi đêm
          là một câu chuyện được kể bằng ánh sáng trên bầu trời sông Hàn. Trong khi chờ đêm tiếp theo — hãy để 5 Hidden Gems lấp đầy ngày của bạn.
        </p>
        <div className="nights-grid">
          {NIGHT_TILES.map((tile, idx) => (
            <div key={idx} className={getTileClass(tile)}>
              <span className="night-date">{tile.dateStr}</span>
              <span className="night-name">{tile.name}</span>
            </div>
          ))}
        </div>
        <div className="diff-btns">
          <a
            href="https://danangfantasticity.com/en/kham-pha/gia-ve-va-lich-thi-dau-le-hoi-phao-hoa-diff-2026"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-blue"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Đặt vé DIFF 2026
          </a>
          <a href="#gems" className="btn-border">
            Xem thêm VR360
          </a>
        </div>
      </section>

      {/* ══ B2B ══ */}
      <section id="b2b">
        <div className="b2b-inner">
          <div className="b2b-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
              <circle cx="9" cy="10" r="2" />
              <path d="M15 8h2M15 12h2" />
            </svg>
          </div>
          <div>
            <p className="b2b-eyebrow">Dành cho doanh nghiệp tại Đà Nẵng</p>
            <h3 className="b2b-h3">
              Địa điểm của bạn chưa có VR360?
              <br />
              MobiFone Đà Nẵng số hóa trong 7 ngày.
            </h3>
            <p className="b2b-p">
              Khách sạn, bảo tàng, khu du lịch, nhà hàng, showroom, trường học — bất kỳ không gian nào cũng có thể trở thành trải nghiệm ảo 360°
              mà khách hàng xem ngay trên điện thoại trước khi đặt chỗ. Tư vấn miễn phí, triển khai nhanh, chi phí phù hợp với mọi quy mô.
            </p>
            <a href="tel:+84935058458" className="b2b-link">
              Tư vấn miễn phí ngay: 0935.058.458
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
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
            <p className="footer-tagline">
              VR360 · Giải pháp số · Hạ tầng Cloud
              <br />
              Nâng tầm trải nghiệm số tại miền Trung
            </p>
          </div>
          <div className="footer-links">
            <a href="https://danang.mobifone.vn" target="_blank" rel="noopener noreferrer">
              Trang chính
            </a>
            <a href="https://it.mobifone.vn" target="_blank" rel="noopener noreferrer">
              Giải pháp số
            </a>
            <a href="https://smarttravel-vr.mobifone.vn" target="_blank" rel="noopener noreferrer">
              Smart Travel VR
            </a>
            <a href="#">Chính sách bảo mật</a>
          </div>
          <div className="footer-right">
            <span className="footer-right-lbl">Tư vấn miễn phí</span>
            <a href="tel:+84935058458" className="footer-hotline">
              0935.058.458
            </a>
          </div>
        </div>
        <p className="footer-bottom">© 2026 MobiFone Đà Nẵng · Hidden Horizons VR360 · Mùa DIFF 2026 · #DiffHiddenHorizons</p>
      </footer>

      {/* ══ CONVENTIONAL MODAL FOR B2B LEAD CAPTURE ══ */}
      {isConsultModalOpen && (
        <div className="modal-overlay" onClick={() => setIsConsultModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsConsultModalOpen(false)} aria-label="Close modal">
              &times;
            </button>
            <h3 className="modal-title">Đăng ký nhận tư vấn</h3>
            <p className="modal-subtitle">Vui lòng để lại thông tin, MobiFone Đà Nẵng sẽ liên hệ hỗ trợ bạn sớm nhất!</p>
            
            <form onSubmit={handleSubmitLead} className="modal-form">
              <div className="modal-form-group">
                <label className="modal-label" htmlFor="leadNameInput">
                  Họ và tên
                </label>
                <input
                  id="leadNameInput"
                  type="text"
                  className="modal-input"
                  placeholder="Nhập họ và tên của bạn (không bắt buộc)"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label" htmlFor="leadPhoneInput">
                  Số điện thoại <span className="required-star">*</span>
                </label>
                <input
                  id="leadPhoneInput"
                  type="tel"
                  required
                  className="modal-input"
                  placeholder="Nhập số điện thoại của bạn (bắt buộc)"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                />
              </div>

              <div className="modal-form-group">
                <label className="modal-label" htmlFor="leadDemandInput">
                  Nhu cầu tư vấn
                </label>
                <textarea
                  id="leadDemandInput"
                  className="modal-textarea"
                  placeholder="Ví dụ: Số hóa khách sạn, showroom, resort... (không bắt buộc)"
                  value={leadDemand}
                  onChange={(e) => setLeadDemand(e.target.value)}
                  rows={3}
                />
              </div>

              <button type="submit" className="modal-submit-btn" disabled={isSubmittingLead}>
                {isSubmittingLead ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
